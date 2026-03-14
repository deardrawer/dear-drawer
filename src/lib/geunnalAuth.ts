import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "geunnal-secret-key"
);

// 그날 페이지 토큰 생성 (24시간 유효)
export async function generateGeunnalToken(pageId: string): Promise<string> {
  return new SignJWT({ pageId, type: "geunnal" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

// 그날 토큰 검증
export async function verifyGeunnalToken(token: string): Promise<{ pageId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type === "geunnal" && typeof payload.pageId === "string") {
      return { pageId: payload.pageId };
    }
    return null;
  } catch {
    return null;
  }
}

// 요청에서 토큰 추출 및 검증
export async function verifyGeunnalRequest(
  request: NextRequest,
  pageId: string
): Promise<{ valid: true; pageId: string } | { valid: false; response: NextResponse }> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "인증 토큰이 필요합니다" },
        { status: 401 }
      ),
    };
  }

  const payload = await verifyGeunnalToken(token);
  if (!payload) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      ),
    };
  }

  if (payload.pageId !== pageId) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      ),
    };
  }

  return { valid: true, pageId: payload.pageId };
}
