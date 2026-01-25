import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin-secret-key"
);

// 관리자 토큰 생성 (24시간 유효)
export async function generateAdminToken(invitationId: string): Promise<string> {
  return new SignJWT({ invitationId, type: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

// 관리자 토큰 검증
export async function verifyAdminToken(token: string): Promise<{ invitationId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type === "admin" && typeof payload.invitationId === "string") {
      return { invitationId: payload.invitationId };
    }
    return null;
  } catch {
    return null;
  }
}

// 요청에서 토큰 추출 및 검증
export async function verifyAdminRequest(
  request: NextRequest,
  inviteId: string
): Promise<{ valid: true; invitationId: string } | { valid: false; response: NextResponse }> {
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

  const payload = await verifyAdminToken(token);
  if (!payload) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      ),
    };
  }

  // 토큰의 invitationId와 요청의 inviteId가 일치하는지 확인
  if (payload.invitationId !== inviteId) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      ),
    };
  }

  return { valid: true, invitationId: payload.invitationId };
}
