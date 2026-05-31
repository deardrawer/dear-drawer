import { getPageBySlug } from "@/lib/geunnalDb";
import { getInvitationById } from "@/lib/db";
import { notFound } from "next/navigation";
import GeunnalClient from "./GeunnalClient";
import type { Viewport, Metadata } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B75D0',
  interactiveWidget: 'resizes-content',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};

  let ogImage = 'https://invite.deardrawer.com/og-image.png';
  if (page.invitation_id) {
    try {
      const invitation = await getInvitationById(page.invitation_id);
      // main_image 또는 content JSON에서 이미지 추출
      let foundImage = invitation?.main_image || '';
      if (!foundImage && invitation?.content) {
        try {
          const c = JSON.parse(invitation.content);
          foundImage = c?.meta?.kakaoThumbnail || c?.meta?.ogImage || c?.media?.coverImage || c?.gallery?.images?.[0] || '';
        } catch { /* */ }
      }
      if (foundImage) {
        ogImage = foundImage.startsWith('https://') ? foundImage : `https://invite.deardrawer.com${foundImage}`;
      }
    } catch { /* fallback */ }
  }

  const title = `${page.groom_name} & ${page.bride_name} 모임 관리`;
  const description = '데이드로어 - 청첩장 모임 관리';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://invite.deardrawer.com/g/${slug}`,
      images: [{ url: ogImage, width: 800, height: 400 }],
      type: 'website',
    },
  };
}

export default async function GeunnalPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await getPageBySlug(slug);
  if (!page) {
    notFound();
  }

  // Get invitation data for share
  let ogImage = 'https://invite.deardrawer.com/og-image.png'
  let invitationSlug: string | null = null
  let kakaoShareData: { thumbnailUrl?: string; shareTitle?: string; shareDescription?: string } = {}
  if (page.invitation_id) {
    try {
      const invitation = await getInvitationById(page.invitation_id)
      // main_image 또는 content JSON에서 이미지 추출
      let foundImg = invitation?.main_image || ''
      if (invitation?.slug) {
        invitationSlug = invitation.slug
      }
      // content JSON에서 카카오 공유 설정 추출 (에디터 ShareModal과 동일한 폴백 순서)
      if (invitation?.content) {
        try {
          const content = JSON.parse(invitation.content)
          // 이미지: kakaoThumbnail > ogImage > coverImage > gallery 첫번째
          const thumb = content?.meta?.kakaoThumbnail
            || content?.meta?.ogImage
            || content?.media?.coverImage
            || content?.gallery?.images?.[0]
          if (thumb) {
            kakaoShareData.thumbnailUrl = thumb.startsWith('https://')
              ? thumb
              : `https://invite.deardrawer.com${thumb}`
          }
          if (content?.meta?.title) kakaoShareData.shareTitle = content.meta.title
          if (content?.meta?.description) kakaoShareData.shareDescription = content.meta.description
          // content에서 찾은 이미지로 foundImg 보강
          if (!foundImg) {
            foundImg = content?.meta?.ogImage || content?.media?.coverImage || content?.gallery?.images?.[0] || ''
          }
        } catch { /* content parse error */ }
      }
      // ogImage 설정
      if (foundImg) {
        ogImage = foundImg.startsWith('https://') ? foundImg : `https://invite.deardrawer.com${foundImg}`
      }
    } catch { /* fallback to default */ }
  }

  return (
    <GeunnalClient
      pageId={page.id}
      slug={page.slug}
      groomName={page.groom_name}
      brideName={page.bride_name}
      weddingDate={page.wedding_date}
      weddingTime={page.wedding_time}
      venueName={page.venue_name}
      venueAddress={page.venue_address}
      hasPassword={!!page.password_hash}
      ogImage={ogImage}
      invitationSlug={invitationSlug}
      invitationId={page.invitation_id || null}
      kakaoShareData={kakaoShareData}
    />
  );
}
