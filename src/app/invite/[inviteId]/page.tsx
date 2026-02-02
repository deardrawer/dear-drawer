import { getInvitationById, getGuestById, recordPageView, recordGuestView } from "@/lib/db";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import InvitationClientPage from "./InvitationClientPage";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ inviteId: string }>;
  searchParams: Promise<{ preview?: string; guest?: string }>;
}

// 이미지 URL을 절대 경로로 변환
function toAbsoluteImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return "";
  // 이미 절대 URL인 경우 (http://, https://, //)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('//')) {
    return imageUrl;
  }
  // 상대 경로인 경우 baseUrl 추가
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  return `${baseUrl}/${imageUrl}`;
}

// 메타데이터 생성
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { inviteId } = await params;
  const { guest: guestId } = await searchParams;
  const baseUrl = "https://invite.deardrawer.com";

  const invitation = await getInvitationById(inviteId);

  if (!invitation) {
    return {
      title: "청첩장을 찾을 수 없습니다",
    };
  }

  // content에서 메타 정보 추출
  let customTitle = "";
  let customDescription = "";
  let rawThumbnailImage = "";
  let senderName = "";
  let receiverName = "";

  if (invitation.content) {
    try {
      const content = JSON.parse(invitation.content);
      // 커스텀 제목/설명 (설정된 경우)
      customTitle = content?.meta?.title || "";
      customDescription = content?.meta?.description || "";
      // 썸네일 우선순위: kakaoThumbnail > ogImage > envelope 썸네일 > coverImage > gallery 첫번째 이미지
      rawThumbnailImage =
        content?.meta?.kakaoThumbnail ||
        content?.meta?.ogImage ||
        content?.envelope?.thumbnailImage ||
        content?.media?.coverImage ||
        content?.gallery?.images?.[0] ||
        "";
      // 발신자/수신자 이름
      senderName = content?.envelope?.senderName || "";
      receiverName = content?.envelope?.receiverName || "";
    } catch (e) {
      console.error("Failed to parse content for metadata:", e);
    }
  }

  // 게스트 정보로 제목 커스텀
  let guestName = "";
  if (guestId) {
    try {
      const guest = await getGuestById(guestId);
      if (guest && guest.invitation_id === invitation.id) {
        guestName = guest.name || "";
      }
    } catch (e) {
      console.error("Failed to fetch guest for metadata:", e);
    }
  }

  // 이미지 URL을 절대 경로로 변환
  const thumbnailImage = toAbsoluteImageUrl(rawThumbnailImage, baseUrl);

  // 기본 제목/설명 생성
  const groomName = invitation.groom_name || senderName || "신랑";
  const brideName = invitation.bride_name || receiverName || "신부";

  // 게스트 이름이 있으면 포함
  let title = customTitle;
  if (!title) {
    if (guestName) {
      title = `${guestName}님께 보내는 청첩장`;
    } else {
      title = `${groomName} ♥ ${brideName} 결혼합니다`;
    }
  }

  const description = customDescription || invitation.greeting_message || "소중한 분들을 결혼식에 초대합니다";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/invite/${inviteId}${guestId ? `?guest=${guestId}` : ''}`,
      siteName: "dear drawer - 모바일 청첩장",
      locale: "ko_KR",
      ...(thumbnailImage && {
        images: [
          {
            url: thumbnailImage,
            width: 800,
            height: 800,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(thumbnailImage && { images: [thumbnailImage] }),
    },
  };
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { inviteId } = await params;
  const { guest: guestId } = await searchParams;

  const invitation = await getInvitationById(inviteId);

  if (!invitation) {
    notFound();
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
          relation: guest.relation || undefined,
          honorific: guest.honorific || undefined,
          custom_message: guest.custom_message || undefined,
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

  // 초기 데이터를 클라이언트 컴포넌트에 전달
  const initialInvitation = {
    id: invitation.id,
    template_id: invitation.template_id,
    content: invitation.content,
    is_paid: invitation.is_paid,
  };

  return (
    <InvitationClientPage
      initialInvitation={initialInvitation}
      initialGuestInfo={guestInfo}
    />
  );
}
