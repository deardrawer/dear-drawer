"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@/types/kakao";
import type { Invitation } from "@/types/invitation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  useEffect(() => {
    // 사용자 정보 로드
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => {
        setLoading(false);
      });

    // 청첩장 목록 로드
    fetch("/api/invitations")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setInvitations(data.invitations || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoadingInvitations(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">대시보드</h1>
          <div className="flex items-center gap-3">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.nickname}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-sm font-bold text-white">
                {user.nickname.charAt(0)}
              </div>
            )}
            <span className="text-slate-300 text-sm hidden md:block">{user.nickname}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-sm font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Create New Button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">내 청첩장</h2>
          <Link
            href="/dashboard/edit/new"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all hover:shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 청첩장 만들기
          </Link>
        </div>

        {/* Invitations List */}
        {loadingInvitations ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">아직 청첩장이 없습니다</h3>
            <p className="text-slate-400 mb-6">새 청첩장을 만들어 소중한 날을 알려보세요</p>
            <Link
              href="/dashboard/edit/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              첫 청첩장 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-slate-600 transition-colors"
              >
                {/* Preview Image */}
                <div className="aspect-[4/3] bg-slate-700/50 relative">
                  {invitation.main_image ? (
                    <img
                      src={invitation.main_image}
                      alt="청첩장 이미지"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {invitation.is_published ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        공개됨
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        임시저장
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {invitation.groom_name && invitation.bride_name
                      ? `${invitation.groom_name} ♥ ${invitation.bride_name}`
                      : "새 청첩장"}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {invitation.wedding_date
                      ? new Date(invitation.wedding_date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "날짜 미정"}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/edit/${invitation.id}`}
                      className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium text-center transition-colors"
                    >
                      수정하기
                    </Link>
                    <button
                      onClick={() => handleDelete(invitation.id)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
