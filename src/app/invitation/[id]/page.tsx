import { getInvitationById, getInvitationBySlug, getInvitationByAlias, recordPageView } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { isUUID } from "@/lib/slug";
import InvitationClient from "@/app/i/[slug]/InvitationClient";
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
    <InvitationClient
      invitation={invitation}
      content={invitationContent}
      isPaid={isPaid}
    />
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
