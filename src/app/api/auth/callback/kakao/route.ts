import { NextRequest, NextResponse } from "next/server";
import { createToken, getAuthCookieOptions } from "@/lib/auth";
import type { KakaoTokenResponse, KakaoUserResponse, User } from "@/types/kakao";

export async function GET(request: NextRequest) {
  console.log("=== Kakao Callback API Start ===");
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    console.log("Code:", code ? code.substring(0, 10) + "..." : "없음");
    console.log("Error:", error);

    // Handle error from Kakao
    if (error) {
      const errorDescription = searchParams.get("error_description") || "Unknown error";
      console.error("Kakao OAuth error:", error, errorDescription);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription)}`, request.url));
    }

    // No authorization code
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url));
    }

    // Get environment variables
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    console.log("ENV - clientId:", clientId || "없음");
    console.log("ENV - redirectUri:", redirectUri || "없음");

    if (!clientId || !redirectUri) {
      throw new Error(`Missing env vars: clientId=${!!clientId}, redirectUri=${!!redirectUri}`);
    }

    // Exchange code for tokens
    console.log("Exchanging code for token...");
    console.log("Token request - clientId:", clientId);
    console.log("Token request - redirectUri:", redirectUri);

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });

    console.log("Token params:", tokenParams.toString());

    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token error:", errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData: KakaoTokenResponse = await tokenResponse.json();
    console.log("Token received:", tokenData.access_token ? "성공" : "실패");

    // Get user info
    console.log("Getting user info...");
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("User info error:", errorText);
      throw new Error(`User info failed: ${errorText}`);
    }

    const kakaoUser: KakaoUserResponse = await userResponse.json();
    console.log("User ID:", kakaoUser.id);

    // Create user object
    const user: User = {
      id: `kakao_${kakaoUser.id}`,
      kakaoId: kakaoUser.id,
      nickname: kakaoUser.kakao_account?.profile?.nickname || "사용자",
      email: kakaoUser.kakao_account?.email,
      profileImage: kakaoUser.kakao_account?.profile?.profile_image_url,
    };

    // Create JWT token
    console.log("Creating JWT token...");
    const jwtToken = await createToken(user);
    console.log("JWT created:", jwtToken ? "성공" : "실패");

    // Create response with redirect
    const redirectUrl = new URL("/my-invitations", request.url);
    console.log("Redirecting to:", redirectUrl.toString());
    const response = NextResponse.redirect(redirectUrl);

    // Set cookie
    const { name, options } = getAuthCookieOptions();
    console.log("Setting cookie:", name, "options:", JSON.stringify(options));
    response.cookies.set(name, jwtToken, options);

    console.log("=== Kakao Callback API Success ===");
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Kakao callback error:", errorMessage);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
