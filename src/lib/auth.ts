import { SignJWT, jwtVerify } from "jose";
import type { User, JWTPayload } from "@/types/kakao";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars"
);

const COOKIE_NAME = "auth-token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function createToken(user: User): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthCookieOptions() {
  return {
    name: COOKIE_NAME,
    options: COOKIE_OPTIONS,
  };
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}

// Kakao OAuth URL builder
export function getKakaoAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Kakao OAuth environment variables are not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "profile_nickname profile_image account_email",
  });

  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function getKakaoToken(code: string) {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Kakao OAuth environment variables are not configured");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });

  if (clientSecret) {
    params.append("client_secret", clientSecret);
  }

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Kakao token: ${error}`);
  }

  return response.json();
}

// Get user info from Kakao
export async function getKakaoUserInfo(accessToken: string) {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Kakao user info: ${error}`);
  }

  return response.json();
}

// Logout from Kakao
export async function logoutFromKakao(accessToken: string) {
  const response = await fetch("https://kapi.kakao.com/v1/user/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}
