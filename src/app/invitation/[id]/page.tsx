import { getInvitationById, getInvitationBySlug, getInvitationByAlias, recordPageView } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { isUUID } from "@/lib/slug";
import InvitationView from "./InvitationView";
import type { Invitation } from "@/types/invitation";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface InvitationLookupResult {
  invitation: Invitation | null;
  isAlias: boolean;
  canonicalSlug?: string;
}

// slug 또는 id로 청첩장 조회 (slug 우선, alias redirect 지원)
async function getInvitation(key: string): Promise<InvitationLookupResult> {
  // UUID 형식이면 ID로 조회
  if (isUUID(key)) {
    const invitation = await getInvitationById(key);
    return { invitation, isAlias: false };
  }

  // 1. 먼저 현재 slug로 조회
  const bySlug = await getInvitationBySlug(key);
  if (bySlug) {
    return { invitation: bySlug, isAlias: false };
  }

  // 2. alias로 조회 (이전 slug로 접속한 경우)
  const byAlias = await getInvitationByAlias(key);
  if (byAlias) {
    return {
      invitation: byAlias,
      isAlias: true,
      canonicalSlug: byAlias.slug || byAlias.id,
    };
  }

  // 3. ID로 시도 (호환성)
  const byId = await getInvitationById(key);
  return { invitation: byId, isAlias: false };
}

export default async function InvitationPage({ params }: PageProps) {
  const { id } = await params;
  const { invitation, isAlias, canonicalSlug } = await getInvitation(id);

  if (!invitation) {
    notFound();
  }

  // alias로 접속한 경우 현재 slug로 301 리다이렉트
  if (isAlias && canonicalSlug) {
    redirect(`/invitation/${canonicalSlug}`);
  }

  // 페이지 조회 기록
  const headersList = await headers();
  const visitorIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || undefined;

  try {
    await recordPageView(invitation.id, visitorIp, userAgent);
  } catch (e) {
    console.error("Failed to record page view:", e);
  }

  // content 필드에서 전체 데이터 파싱
  let invitationContent = null;
  if (invitation.content) {
    try {
      invitationContent = JSON.parse(invitation.content);
    } catch (e) {
      console.error("Failed to parse invitation content:", e);
    }
  }

  const isPaid = invitation.is_paid === 1;

  return (
    <div className="relative min-h-screen">
      {/* 워터마크 - 서버에서 렌더링되므로 클라이언트에서 제거 불가 */}
      {!isPaid && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-none select-none"
          style={{
            background: "repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(0,0,0,0.02) 100px, rgba(0,0,0,0.02) 200px)",
          }}
        >
          {/* 중앙 워터마크 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-center transform rotate-[-15deg]"
              style={{
                opacity: 0.15,
              }}
            >
              <p className="text-6xl font-bold text-gray-900 tracking-widest">SAMPLE</p>
              <p className="text-xl text-gray-700 mt-2">샘플 미리보기</p>
            </div>
          </div>
          {/* 반복 워터마크 패턴 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  45deg,
                  transparent 0px,
                  transparent 300px,
                  rgba(0, 0, 0, 0.03) 300px,
                  rgba(0, 0, 0, 0.03) 301px
                )
              `,
            }}
          />
          {/* 상단 배너 */}
          <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-medium">
            이것은 샘플 미리보기입니다. 결제 후 워터마크가 제거됩니다.
          </div>
        </div>
      )}

      {/* 청첩장 콘텐츠 */}
      <InvitationView
        invitation={invitation}
        content={invitationContent}
        isPaid={isPaid}
      />
    </div>
  );
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { invitation } = await getInvitation(id);

  if (!invitation) {
    return {
      title: "청첩장을 찾을 수 없습니다",
    };
  }

  const groomName = invitation.groom_name || "신랑";
  const brideName = invitation.bride_name || "신부";

  return {
    title: `${groomName} ♥ ${brideName} 결혼합니다`,
    description: invitation.greeting_message || "저희 결혼식에 초대합니다",
    openGraph: {
      title: `${groomName} ♥ ${brideName} 결혼합니다`,
      description: invitation.greeting_message || "저희 결혼식에 초대합니다",
      type: "website",
    },
  };
}
