import { getInvitationById, getInvitationBySlug, getInvitationByAlias, recordPageView, getGuestById, recordGuestView } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { isUUID } from "@/lib/slug";
import InvitationClient from "@/app/i/[slug]/InvitationClient";
import InvitationClientFamily from "@/app/i/[slug]/InvitationClientFamily";
import InvitationClientFilm from "@/app/i/[slug]/InvitationClientFilm";
import InvitationClientMagazine from "@/app/i/[slug]/InvitationClientMagazine";
import InvitationClientRecord from "@/app/i/[slug]/InvitationClientRecord";
import InvitationClientExhibit from "@/app/i/[slug]/InvitationClientExhibit";
import InvitationClientEssay from "@/app/i/[slug]/InvitationClientEssay";
import InvitationClientThankYou from "@/app/i/[slug]/InvitationClientThankYou";
import InvitationClientTheSimple from "@/app/i/[slug]/InvitationClientTheSimple";
import InvitationClientClassic from "@/app/i/[slug]/InvitationClientClassic";
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

// 상대/절대 이미지 URL 정규화 (og:image는 반드시 절대 URL이어야 함)
function toAbsoluteImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('//')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  return `${baseUrl}/${imageUrl}`;
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

  // 감사장은 별도 렌더링 (props가 다름)
  if (invitation.template_id === 'narrative-thankyou') {
    return (
      <InvitationClientThankYou
        invitation={invitation}
        content={invitationContent}
        isPaid={isPaid}
        isPreview={isPreview}
      />
    );
  }

  // 템플릿에 따라 적절한 컴포넌트 렌더링
  const ClientComponent = (() => {
    switch (invitation.template_id) {
      case 'narrative-family': return InvitationClientFamily;
      case 'narrative-film': return InvitationClientFilm;
      case 'narrative-magazine': return InvitationClientMagazine;
      case 'narrative-record': return InvitationClientRecord;
      case 'narrative-exhibit': return InvitationClientExhibit;
      case 'narrative-essay': return InvitationClientEssay;
      case 'narrative-the-simple': return InvitationClientTheSimple;
      case 'narrative-classic': return InvitationClientClassic;
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

  const baseUrl = "https://invite.deardrawer.com";
  const groomName = invitation.groom_name || "신랑";
  const brideName = invitation.bride_name || "신부";

  // content에서 커스텀 메타 정보 및 썸네일 추출
  let customTitle = "";
  let customDescription = "";
  let rawThumbnailImage = "";

  if (invitation.content) {
    try {
      const content = JSON.parse(invitation.content);
      customTitle = content?.meta?.title || "";
      customDescription = content?.meta?.description || "";
      // 이미지 값에서 URL 추출 (string 또는 ImageCropData 객체 대응)
      const extractImageUrl = (img: unknown): string => {
        if (!img) return "";
        if (typeof img === "string") return img;
        if (typeof img === "object" && img !== null && "url" in img) return (img as { url: string }).url || "";
        return "";
      };
      // THE SIMPLE 갤러리 첫 번째 이미지 추출
      let theSimpleGalleryFirst = "";
      if (content?.galleries) {
        for (const key of Object.keys(content.galleries)) {
          const imgs = content.galleries[key];
          if (Array.isArray(imgs) && imgs.length > 0) {
            theSimpleGalleryFirst = imgs[0]?.webUrl || imgs[0]?.url || "";
            if (theSimpleGalleryFirst) break;
          }
        }
      }
      // OG 썸네일 우선순위: 사용자가 직접 지정한 별도 OG 이미지 > 자동 fallback(커버/히어로/
      //   갤러리 등) > 카카오 썸네일.
      //   ※ 카카오 썸네일(정사각형 소형)은 og:image로 쓰면 카톡/문자가 미리보기 카드를
      //     못 만들어 "링크만 뜨는" 문제가 생기므로 최후 fallback으로 둔다.
      rawThumbnailImage =
        (content?.meta?.ogImageCropped as string) ||
        extractImageUrl(content?.meta?.ogImage) ||
        extractImageUrl(content?.media?.coverImage) ||
        extractImageUrl(content?.heroImage) ||
        extractImageUrl(content?.mainImage) ||
        extractImageUrl(content?.sections?.intro?.photo) ||
        extractImageUrl(content?.gallery?.images?.[0]) ||
        theSimpleGalleryFirst ||
        (content?.meta?.kakaoThumbnailCropped as string) ||
        extractImageUrl(content?.meta?.kakaoThumbnail) ||
        "";
    } catch (e) {
      console.error("Failed to parse content for metadata:", e);
    }
  }

  const thumbnailImage = toAbsoluteImageUrl(rawThumbnailImage, baseUrl);

  const isThankYouTemplate = invitation.template_id === 'narrative-thankyou';
  const isTheSimpleTemplate = invitation.template_id === 'narrative-the-simple';
  const title = customTitle || (isThankYouTemplate ? `${groomName} & ${brideName}의 감사 인사` : `${groomName} ♥ ${brideName} 결혼합니다`);

  // THE SIMPLE: 날짜/장소 기반 자동 설명
  let autoDescription = '';
  if (!customDescription && isTheSimpleTemplate && invitation.content) {
    try {
      const c = JSON.parse(invitation.content);
      const wDate = c?.wedding?.date;
      const wTime = c?.wedding?.timeDisplay;
      const vName = c?.wedding?.venue?.name;
      if (wDate) {
        const d = new Date(wDate + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          const wd = ['일','월','화','수','목','금','토'];
          autoDescription = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${wd[d.getDay()]}요일${wTime ? ` ${wTime}` : ''}`;
          if (vName) autoDescription += `\n${vName}`;
        }
      }
    } catch { /* ignore */ }
  }
  const description = customDescription || autoDescription || invitation.greeting_message || (isThankYouTemplate ? "감사장이 도착했습니다" : "저희 결혼식에 초대합니다");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/invitation/${invitation.slug || invitation.id}`,
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
