import { NextRequest, NextResponse } from "next/server";
import { getKakaoToken, getKakaoUserInfo, createToken, getAuthCookieOptions } from "@/lib/auth";
import type { KakaoTokenResponse, KakaoUserResponse, User } from "@/types/kakao";

export async function GET(request: NextRequest) {
  console.log("=== Kakao Callback API Start ===");
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    console.log("Code:", code ? "있음" : "없음");
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

    // Exchange code for tokens
    console.log("Exchanging code for token...");
    const tokenData: KakaoTokenResponse = await getKakaoToken(code);
    console.log("Token received:", tokenData.access_token ? "성공" : "실패");

    // Get user info
    console.log("Getting user info...");
    const kakaoUser: KakaoUserResponse = await getKakaoUserInfo(tokenData.access_token);
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
    const redirectUrl = new URL("/dashboard", request.url);
    console.log("Redirecting to:", redirectUrl.toString());
    const response = NextResponse.redirect(redirectUrl);

    // Set cookie
    const { name, options } = getAuthCookieOptions();
    console.log("Setting cookie:", name, "options:", JSON.stringify(options));
    response.cookies.set(name, jwtToken, options);

    console.log("=== Kakao Callback API Success ===");
    return response;
  } catch (error) {
    console.error("Kakao callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("로그인 처리 중 오류가 발생했습니다.")}`, request.url)
    );
  }
}
