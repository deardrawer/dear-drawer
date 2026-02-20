import { getInvitationBySlug, getInvitationByAlias, getInvitationById, recordPageView, getGuestById, getGreetingTemplateById, recordGuestView } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import InvitationClient from "./InvitationClient";
import InvitationClientFamily from "./InvitationClientFamily";
import InvitationClientMagazine from "./InvitationClientMagazine";
import InvitationClientFilm from "./InvitationClientFilm";
import InvitationClientRecord from "./InvitationClientRecord";
import InvitationClientExhibit from "./InvitationClientExhibit";
import type { Invitation } from "@/types/invitation";
import type { Viewport } from "next";
import { isUUID } from "@/lib/slug";
import { createSampleInvitation, ourSampleContent, familySampleContent } from "@/lib/sample-data";

// 핀치 줌 비활성화를 위한 viewport 설정
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; colorTheme?: string; fontStyle?: string; skipIntro?: string; guest?: string }>;
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview, colorTheme, fontStyle, skipIntro, guest: guestId } = await searchParams;
  const isPreview = preview === 'true';
  const shouldSkipIntro = skipIntro === 'true';

  let invitation = null;
  let isSampleInvitation = false;

  // 샘플 청첩장 처리 (sample-our, sample-family, sample-magazine, sample-film, sample-record)
  if (slug === 'sample-our' || slug === 'sample-family' || slug === 'sample-magazine' || slug === 'sample-film' || slug === 'sample-record' || slug === 'sample-exhibit' || slug === 'sample-feed') {
    const sampleType = (slug === 'sample-exhibit' || slug === 'sample-feed') ? 'exhibit' : slug === 'sample-record' ? 'record' : slug === 'sample-film' ? 'film' : slug === 'sample-magazine' ? 'magazine' : slug === 'sample-our' ? 'our' : 'family';
    invitation = createSampleInvitation(sampleType);
    isSampleInvitation = true;
  }

  // 1. slug로 청첩장 조회
  if (!invitation) {
    invitation = await getInvitationBySlug(slug);
  }

  // 2. ID로 조회 (UUID 또는 8자리 short ID)
  if (!invitation) {
    invitation = await getInvitationById(slug);
  }

  // 2. alias로 조회 (이전 slug로 접속한 경우)
  if (!invitation) {
    const byAlias = await getInvitationByAlias(slug);
    if (byAlias) {
      // 현재 slug로 리다이렉트 (guest 파라미터 유지)
      const redirectUrl = guestId
        ? `/i/${byAlias.slug || byAlias.id}?guest=${guestId}`
        : `/i/${byAlias.slug || byAlias.id}`;
      redirect(redirectUrl);
    }
  }

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
        // 맞춤 인사말 결정: 템플릿 > custom_message
        let customMessage = guest.custom_message || undefined;

        // greeting_template_id가 있으면 템플릿 내용 가져오기
        if (guest.greeting_template_id && !customMessage) {
          try {
            const template = await getGreetingTemplateById(guest.greeting_template_id);
            if (template) {
              // 템플릿 내용에서 변수 치환 ({이름}, {관계})
              customMessage = template.content
                .replace(/\{이름\}/g, guest.name || '')
                .replace(/\{관계\}/g, guest.relation || '');
            }
          } catch (templateErr) {
            console.error("Failed to fetch greeting template:", templateErr);
          }
        }

        guestInfo = {
          id: guest.id,
          name: guest.name,
          relation: guest.relation,
          honorific: guest.honorific,
          introGreeting: guest.intro_greeting,
          customMessage: customMessage ?? null,
        };
        // 게스트 열람 기록
        await recordGuestView(guestId);
      }
    } catch (e) {
      console.error("Failed to fetch guest info:", e);
    }
  }

  // 페이지 조회 기록 (샘플 청첩장은 제외)
  if (!isSampleInvitation) {
    const headersList = await headers();
    const visitorIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || undefined;

    try {
      await recordPageView(invitation.id, visitorIp, userAgent);
    } catch (e) {
      console.error("Failed to record page view:", e);
    }
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
  const isFamily = invitation.template_id === 'narrative-family';
  const isMagazine = invitation.template_id === 'narrative-magazine';
  const isFilm = invitation.template_id === 'narrative-film';
  const isRecord = invitation.template_id === 'narrative-record';
  const isExhibit = invitation.template_id === 'narrative-exhibit';

  // 템플릿에 따라 적절한 컴포넌트 렌더링
  const ClientComponent = isExhibit ? InvitationClientExhibit : isRecord ? InvitationClientRecord : isFilm ? InvitationClientFilm : isMagazine ? InvitationClientMagazine : isFamily ? InvitationClientFamily : InvitationClient;

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
      isSample={isSampleInvitation}
    />
  );
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
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = "https://invite.deardrawer.com";

  // 샘플 청첩장 메타데이터 처리
  if (slug === 'sample-our' || slug === 'sample-family' || slug === 'sample-film' || slug === 'sample-record' || slug === 'sample-exhibit' || slug === 'sample-feed') {
    const sampleType = (slug === 'sample-exhibit' || slug === 'sample-feed') ? 'exhibit' : slug === 'sample-record' ? 'record' : slug === 'sample-film' ? 'film' : slug === 'sample-our' ? 'our' : 'family';
    const content = sampleType === 'our' ? ourSampleContent : familySampleContent;
    const title = `${content.groom.name} ♥ ${content.bride.name} 결혼합니다`;
    const description = content.content.greeting;
    const thumbnailImage = toAbsoluteImageUrl(content.media.coverImage, baseUrl);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${baseUrl}/i/${slug}`,
        siteName: "dear drawer - 모바일 청첩장",
        locale: "ko_KR",
        ...(thumbnailImage && {
          images: [
            {
              url: thumbnailImage,
              width: 800,
              height: 400,
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

  // slug로 먼저 조회, 없으면 ID로 조회
  let invitation = await getInvitationBySlug(slug);
  if (!invitation) {
    invitation = await getInvitationById(slug);
  }

  if (!invitation) {
    return {
      title: "청첩장을 찾을 수 없습니다",
    };
  }

  const groomName = invitation.groom_name || "신랑";
  const brideName = invitation.bride_name || "신부";

  // content에서 커스텀 메타 정보 및 썸네일 추출
  let customTitle = "";
  let customDescription = "";
  let rawThumbnailImage = "";

  if (invitation.content) {
    try {
      const content = JSON.parse(invitation.content);
      // 커스텀 제목/설명 (설정된 경우)
      customTitle = content?.meta?.title || "";
      customDescription = content?.meta?.description || "";
      // 이미지 값에서 URL 추출 (string 또는 ImageCropData 객체 대응)
      const extractImageUrl = (img: unknown): string => {
        if (!img) return "";
        if (typeof img === "string") return img;
        if (typeof img === "object" && img !== null && "url" in img) return (img as { url: string }).url || "";
        return "";
      };
      // OG 썸네일 우선순위: ogImage > coverImage > mainImage > gallery 첫번째 이미지 > kakaoThumbnail
      rawThumbnailImage =
        extractImageUrl(content?.meta?.ogImage) ||
        extractImageUrl(content?.media?.coverImage) ||
        extractImageUrl(content?.mainImage) ||
        extractImageUrl(content?.gallery?.images?.[0]) ||
        extractImageUrl(content?.meta?.kakaoThumbnail) ||
        "";
    } catch (e) {
      console.error("Failed to parse content for metadata:", e);
    }
  }

  // 이미지 URL을 절대 경로로 변환
  const thumbnailImage = toAbsoluteImageUrl(rawThumbnailImage, baseUrl);

  // 커스텀 값이 있으면 사용, 없으면 자동 생성
  const title = customTitle || `${groomName} ♥ ${brideName} 결혼합니다`;
  const description = customDescription || invitation.greeting_message || "저희 결혼식에 초대합니다";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/i/${slug}`,
      siteName: "dear drawer - 모바일 청첩장",
      locale: "ko_KR",
      ...(thumbnailImage && {
        images: [
          {
            url: thumbnailImage,
            width: 800,
            height: 400,
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
