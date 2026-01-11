"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleKakaoLogin = () => {
    console.log("=== Kakao Login Debug ===");
    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    console.log("Client ID:", clientId);
    console.log("Redirect URI:", redirectUri);

    if (!clientId || !redirectUri) {
      alert(`카카오 로그인 설정이 되어있지 않습니다.\nClient ID: ${clientId}\nRedirect URI: ${redirectUri}`);
      return;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile_nickname profile_image account_email",
    });

    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  };

  // Check if already logged in
  useEffect(() => {
    console.log("=== Login Page Loaded ===");
    console.log("KAKAO_CLIENT_ID:", process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID);
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        // Not logged in, stay on login page
      });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-yellow-400/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <main className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/25">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          환영합니다
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          서비스를 이용하려면 로그인하세요
        </p>

        {/* Login Buttons */}
        <div className="space-y-4">
          {/* Kakao Login Button */}
          <button
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-semibold text-lg transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Kakao Icon */}
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.734 1.8 5.127 4.5 6.47-.156.561-.988 3.538-1.02 3.766 0 0-.02.167.088.231.109.064.237.015.237.015.314-.044 3.636-2.371 4.2-2.773.627.089 1.303.143 1.995.143 5.523 0 10-3.463 10-7.852S17.523 3 12 3" />
            </svg>
            카카오로 시작하기
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-slate-500 text-sm">
          로그인하면 서비스 이용약관과
          <br />
          개인정보처리방침에 동의하게 됩니다.
        </p>
      </main>

      {/* Bottom indicator */}
      <footer className="absolute bottom-6 text-slate-500 text-sm">
        © 2025 All rights reserved
      </footer>
    </div>
  );
}
