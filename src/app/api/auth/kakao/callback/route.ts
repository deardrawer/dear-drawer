import { NextRequest, NextResponse } from "next/server";
import { createToken, getAuthCookieOptions } from "@/lib/auth";
import type { KakaoTokenResponse, KakaoUserResponse, User } from "@/types/kakao";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    // Handle error from Kakao
    if (error) {
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent("카카오 로그인에 실패했습니다.")}`, request.url));
    }

    // No authorization code
    if (!code) {
      return NextResponse.redirect(new URL("/?error=no_code", request.url));
    }

    // Get environment variables
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error("Missing Kakao OAuth environment variables");
    }

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });

    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }

    const tokenData: KakaoTokenResponse = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("User info retrieval failed");
    }

    const kakaoUser: KakaoUserResponse = await userResponse.json();

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
    const redirectUrl = new URL("/my-invitations", request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set cookie
    const { name, options } = getAuthCookieOptions();
    response.cookies.set(name, jwtToken, options);

    return response;
  } catch (error) {
    console.error("Kakao callback error:", error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent("로그인 처리 중 오류가 발생했습니다.")}`, request.url)
    );
  }
}
