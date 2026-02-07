import { SignJWT, jwtVerify } from "jose";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { User, JWTPayload } from "@/types/kakao";

// Cloudflare 환경변수 타입
interface CloudflareEnv {
  JWT_SECRET?: string;
  NEXT_PUBLIC_KAKAO_CLIENT_ID?: string;
  NEXT_PUBLIC_KAKAO_REDIRECT_URI?: string;
  KAKAO_CLIENT_SECRET?: string;
}

// JWT Secret 가져오기 (동적)
async function getJwtSecret(): Promise<Uint8Array> {
  try {
    const { env } = await getCloudflareContext() as { env: CloudflareEnv };
    const secret = env.JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not configured");
    }
    return new TextEncoder().encode(secret);
  } catch (e) {
    // Re-throw if it's our own error
    if (e instanceof Error && e.message.includes("JWT_SECRET")) throw e;
    // Fallback for build time or non-Cloudflare environment
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not configured");
    }
    return new TextEncoder().encode(secret);
  }
}

// 환경변수 가져오기 (동적)
async function getEnvVar(key: keyof CloudflareEnv): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext() as { env: CloudflareEnv };
    return env[key] || process.env[key];
  } catch {
    return process.env[key];
  }
}

const COOKIE_NAME = "auth-token";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export async function createToken(user: User): Promise<string> {
  const secret = await getJwtSecret();
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = await getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
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
  const clientId = await getEnvVar("NEXT_PUBLIC_KAKAO_CLIENT_ID");
  const clientSecret = await getEnvVar("KAKAO_CLIENT_SECRET");
  const redirectUri = await getEnvVar("NEXT_PUBLIC_KAKAO_REDIRECT_URI");

  if (!clientId || !redirectUri) {
    throw new Error(`Kakao OAuth environment variables are not configured. clientId: ${!!clientId}, redirectUri: ${!!redirectUri}`);
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
