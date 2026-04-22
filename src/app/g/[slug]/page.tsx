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
      if (invitation?.main_image) {
        ogImage = invitation.main_image.startsWith('https://')
          ? invitation.main_image
          : `https://invite.deardrawer.com${invitation.main_image}`;
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
      if (invitation?.main_image) {
        ogImage = invitation.main_image.startsWith('https://')
          ? invitation.main_image
          : `https://invite.deardrawer.com${invitation.main_image}`
      }
      if (invitation?.slug) {
        invitationSlug = invitation.slug
      }
      // content JSON에서 카카오 공유 설정 추출
      if (invitation?.content) {
        try {
          const content = JSON.parse(invitation.content)
          if (content?.meta) {
            const thumb = content.meta.kakaoThumbnail
            if (thumb) {
              kakaoShareData.thumbnailUrl = thumb.startsWith('https://')
                ? thumb
                : `https://invite.deardrawer.com${thumb}`
            }
            if (content.meta.title) kakaoShareData.shareTitle = content.meta.title
            if (content.meta.description) kakaoShareData.shareDescription = content.meta.description
          }
        } catch { /* content parse error */ }
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
      kakaoShareData={kakaoShareData}
    />
  );
}
