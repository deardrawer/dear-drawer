import { NextRequest, NextResponse } from "next/server";
import { getKakaoToken, getKakaoUserInfo, createToken, getAuthCookieOptions } from "@/lib/auth";
import type { KakaoTokenResponse, KakaoUserResponse, User } from "@/types/kakao";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

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
    const tokenData: KakaoTokenResponse = await getKakaoToken(code);

    // Get user info
    const kakaoUser: KakaoUserResponse = await getKakaoUserInfo(tokenData.access_token);

    // Create user object
    const user: User = {
      id: `kakao_${kakaoUser.id}`,
      kakaoId: kakaoUser.id,
      nickname: kakaoUser.kakao_account?.profile?.nickname || "사용자",
      email: kakaoUser.kakao_account?.email,
      profileImage: kakaoUser.kakao_account?.profile?.profile_image_url,
    };

    // Create JWT token
    const jwtToken = await createToken(user);

    // Create response with redirect
    const response = NextResponse.redirect(new URL("/dashboard", request.url));

    // Set cookie
    const { name, options } = getAuthCookieOptions();
    response.cookies.set(name, jwtToken, options);

    return response;
  } catch (error) {
    console.error("Kakao callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("로그인 처리 중 오류가 발생했습니다.")}`, request.url)
    );
  }
}
