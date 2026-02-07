import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getAuthCookieName } from "@/lib/auth";
import {
  getInvitationById,
  updateInvitation,
  isSlugAvailable,
  createSlugAlias,
  countAliasesByInvitationId,
  getAliasBySlug,
  deleteSlugAlias,
} from "@/lib/db";
import { validateSlug, generateSlugSuggestions } from "@/lib/slug";

const MAX_ALIASES_PER_INVITATION = 10;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 슬러그 설정/변경
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 });
    }

    // 청첩장 조회
    const invitation = await getInvitationById(id);
    if (!invitation) {
      return NextResponse.json({ error: "청첩장을 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 청첩장인지 확인
    if (invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json() as { slug: string | null };
    const { slug } = body;

    // slug가 null이면 슬러그 제거
    if (slug === null || slug === "") {
      const updated = await updateInvitation(id, payload.user.id, { slug: null as unknown as string });
      return NextResponse.json({
        success: true,
        invitation: updated,
        message: "슬러그가 제거되었습니다.",
      });
    }

    // 슬러그 유효성 검사
    const validation = validateSlug(slug);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const normalizedSlug = validation.normalizedSlug!;

    // 현재 slug 저장 (나중에 alias로 사용)
    const currentSlug = invitation.slug;

    // 중복 체크 (본인 제외)
    const available = await isSlugAvailable(normalizedSlug, id);
    if (!available) {
      // 대체 슬러그 추천
      const suggestions = generateSlugSuggestions(normalizedSlug);
      const availableSuggestions: string[] = [];

      for (const suggestion of suggestions) {
        if (await isSlugAvailable(suggestion, id)) {
          availableSuggestions.push(suggestion);
          if (availableSuggestions.length >= 3) break;
        }
      }

      return NextResponse.json(
        {
          error: "이미 사용 중인 슬러그입니다.",
          suggestions: availableSuggestions,
        },
        { status: 409 }
      );
    }

    // 기존 slug가 있고, 새 slug로 변경하는 경우 alias 처리
    if (currentSlug && currentSlug !== normalizedSlug) {
      // alias 개수 제한 확인
      const aliasCount = await countAliasesByInvitationId(id);
      if (aliasCount >= MAX_ALIASES_PER_INVITATION) {
        return NextResponse.json(
          {
            error: `최대 ${MAX_ALIASES_PER_INVITATION}개의 이전 URL만 유지할 수 있습니다.`,
          },
          { status: 400 }
        );
      }

      // 새 slug가 이전에 사용했던 자신의 alias인지 확인
      const existingAlias = await getAliasBySlug(normalizedSlug);
      if (existingAlias && existingAlias.invitation_id === id) {
        // 이전 slug를 재사용하므로 해당 alias 삭제
        await deleteSlugAlias(existingAlias.id, id);
      }

      // 현재 slug를 alias로 저장
      try {
        await createSlugAlias(id, currentSlug);
      } catch (error) {
        console.error("Failed to create slug alias:", error);
        // alias 생성 실패해도 slug 업데이트는 계속 진행
      }
    }

    // 슬러그 업데이트
    const updated = await updateInvitation(id, payload.user.id, { slug: normalizedSlug });

    return NextResponse.json({
      success: true,
      invitation: updated,
      slug: normalizedSlug,
      url: `/invitation/${normalizedSlug}`,
    });
  } catch (error) {
    console.error("Slug update error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 현재 슬러그 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 });
    }

    const invitation = await getInvitationById(id);
    if (!invitation) {
      return NextResponse.json({ error: "청첩장을 찾을 수 없습니다." }, { status: 404 });
    }

    if (invitation.user_id !== payload.user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json({
      slug: invitation.slug,
      isPaid: invitation.is_paid === 1,
      url: invitation.slug ? `/invitation/${invitation.slug}` : `/invitation/${invitation.id}`,
    });
  } catch (error) {
    console.error("Get slug error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
