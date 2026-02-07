import { NextRequest, NextResponse } from "next/server";
import { isSlugAvailable, getAliasBySlug } from "@/lib/db";
import { validateSlug, generateSlugSuggestions, normalizeSlug } from "@/lib/slug";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

// 간단한 인메모리 Rate Limiter (IP별 분당 20회)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId"); // 본인 청첩장 제외 (수정 시)

    if (!slug) {
      return NextResponse.json(
        { error: "slug 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 슬러그 유효성 검사
    const validation = validateSlug(slug);
    if (!validation.isValid) {
      return NextResponse.json({
        available: false,
        error: validation.error,
        normalizedSlug: validation.normalizedSlug,
      });
    }

    const normalizedSlug = validation.normalizedSlug!;

    // 중복 체크
    const available = await isSlugAvailable(normalizedSlug, excludeId || undefined);

    if (!available) {
      // alias인지 확인하여 더 구체적인 에러 메시지 제공
      const aliasRecord = await getAliasBySlug(normalizedSlug);
      const isAlias = !!aliasRecord;

      // 자신의 이전 slug인 경우는 사용 가능 (isSlugAvailable에서 이미 처리되지만 메시지용)
      if (isAlias && excludeId && aliasRecord.invitation_id === excludeId) {
        return NextResponse.json({
          available: true,
          slug: normalizedSlug,
          message: "이전에 사용하던 URL입니다. 다시 사용할 수 있습니다.",
        });
      }

      // 대체 슬러그 추천
      const suggestions = generateSlugSuggestions(normalizedSlug);
      const availableSuggestions: string[] = [];

      // 추천 슬러그 중 사용 가능한 것 찾기
      for (const suggestion of suggestions) {
        if (await isSlugAvailable(suggestion, excludeId || undefined)) {
          availableSuggestions.push(suggestion);
          if (availableSuggestions.length >= 3) break;
        }
      }

      return NextResponse.json({
        available: false,
        slug: normalizedSlug,
        error: isAlias
          ? "이 URL은 다른 청첩장의 이전 주소로 사용 중입니다."
          : "이미 사용 중인 슬러그입니다.",
        isAlias,
        suggestions: availableSuggestions,
      });
    }

    return NextResponse.json({
      available: true,
      slug: normalizedSlug,
    });
  } catch (error) {
    console.error("Slug check error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
