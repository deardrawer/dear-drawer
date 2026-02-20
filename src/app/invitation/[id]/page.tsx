import { getInvitationById, getInvitationBySlug, getInvitationByAlias, recordPageView, getGuestById, recordGuestView } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { isUUID } from "@/lib/slug";
import InvitationClient from "@/app/i/[slug]/InvitationClient";
import InvitationClientFamily from "@/app/i/[slug]/InvitationClientFamily";
import InvitationClientFilm from "@/app/i/[slug]/InvitationClientFilm";
import InvitationClientMagazine from "@/app/i/[slug]/InvitationClientMagazine";
import InvitationClientRecord from "@/app/i/[slug]/InvitationClientRecord";
import type { Invitation } from "@/types/invitation";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string; colorTheme?: string; fontStyle?: string; skipIntro?: string; guest?: string }>;
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

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { preview, colorTheme, fontStyle, skipIntro, guest: guestId } = await searchParams;
  const isPreview = preview === 'true';
  const shouldSkipIntro = skipIntro === 'true';

  const { invitation, isAlias, canonicalSlug } = await getInvitation(id);

  if (!invitation) {
    notFound();
  }

  // PARENTS 템플릿은 /invite/ 경로로 리다이렉트
  const isParentsTemplate =
    invitation.template_id === 'narrative-parents' ||
    invitation.template_id === 'parents' ||
    invitation.template_id === 'parents-formal';

  if (isParentsTemplate) {
    const slug = invitation.slug || invitation.id;
    const redirectUrl = guestId
      ? `/invite/${slug}?guest=${guestId}`
      : `/invite/${slug}`;
    redirect(redirectUrl);
  }

  // alias로 접속한 경우 현재 slug로 301 리다이렉트
  if (isAlias && canonicalSlug) {
    const redirectUrl = guestId
      ? `/invitation/${canonicalSlug}?guest=${guestId}`
      : `/invitation/${canonicalSlug}`;
    redirect(redirectUrl);
  }

  // 게스트 정보 조회 (guest 파라미터가 있는 경우)
  let guestInfo = null;
  if (guestId) {
    try {
      const guest = await getGuestById(guestId);
      // 게스트가 이 청첩장에 속하는지 확인
      if (guest && guest.invitation_id === invitation.id) {
        guestInfo = {
          id: guest.id,
          name: guest.name,
          relation: guest.relation,
          honorific: guest.honorific,
          introGreeting: guest.intro_greeting,
          customMessage: guest.custom_message,
        };
        // 게스트 열람 기록
        await recordGuestView(guestId);
      }
    } catch (e) {
      console.error("Failed to fetch guest info:", e);
    }
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

  // 템플릿에 따라 적절한 컴포넌트 렌더링
  const ClientComponent = (() => {
    switch (invitation.template_id) {
      case 'narrative-family': return InvitationClientFamily;
      case 'narrative-film': return InvitationClientFilm;
      case 'narrative-magazine': return InvitationClientMagazine;
      case 'narrative-record': return InvitationClientRecord;
      default: return InvitationClient;
    }
  })();

  return (
    <ClientComponent
      invitation={invitation}
      content={invitationContent}
      isPaid={isPaid}
      isPreview={isPreview}
      overrideColorTheme={colorTheme}
      overrideFontStyle={fontStyle}
      skipIntro={shouldSkipIntro}
      guestInfo={guestInfo}
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
