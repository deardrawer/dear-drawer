import { getInvitationBySlug, getInvitationByAlias, getInvitationById, recordPageView } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import InvitationClient from "./InvitationClient";
import type { Invitation } from "@/types/invitation";
import { isUUID } from "@/lib/slug";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; colorTheme?: string; fontStyle?: string; skipIntro?: string }>;
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview, colorTheme, fontStyle, skipIntro } = await searchParams;
  const isPreview = preview === 'true';
  const shouldSkipIntro = skipIntro === 'true';

  let invitation = null;

  // UUID인 경우 ID로 먼저 조회
  if (isUUID(slug)) {
    invitation = await getInvitationById(slug);
  }

  // 1. slug로 청첩장 조회
  if (!invitation) {
    invitation = await getInvitationBySlug(slug);
  }

  // 2. alias로 조회 (이전 slug로 접속한 경우)
  if (!invitation) {
    const byAlias = await getInvitationByAlias(slug);
    if (byAlias) {
      // 현재 slug로 리다이렉트
      redirect(`/i/${byAlias.slug || byAlias.id}`);
    }
  }

  if (!invitation) {
    notFound();
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
      isPreview={isPreview}
      overrideColorTheme={colorTheme}
      overrideFontStyle={fontStyle}
      skipIntro={shouldSkipIntro}
    />
  );
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const invitation = await getInvitationBySlug(slug);

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
  let thumbnailImage = "";

  if (invitation.content) {
    try {
      const content = JSON.parse(invitation.content);
      // 커스텀 제목/설명 (설정된 경우)
      customTitle = content?.meta?.title || "";
      customDescription = content?.meta?.description || "";
      // 우선순위: kakaoThumbnail > ogImage > coverImage > gallery 첫번째 이미지
      thumbnailImage =
        content?.meta?.kakaoThumbnail ||
        content?.meta?.ogImage ||
        content?.media?.coverImage ||
        content?.gallery?.images?.[0] ||
        "";
    } catch (e) {
      console.error("Failed to parse content for metadata:", e);
    }
  }

  // 커스텀 값이 있으면 사용, 없으면 자동 생성
  const title = customTitle || `${groomName} ♥ ${brideName} 결혼합니다`;
  const description = customDescription || invitation.greeting_message || "저희 결혼식에 초대합니다";

  const baseUrl = "https://invite.deardrawer.com";

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
