import { getPageBySlug } from "@/lib/geunnalDb";
import { getInvitationById } from "@/lib/db";
import { notFound } from "next/navigation";
import GeunnalClient from "./GeunnalClient";
import type { Viewport } from "next";

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

export default async function GeunnalPage({ params }: PageProps) {
  const { slug } = await params;

  const page = await getPageBySlug(slug);
  if (!page) {
    notFound();
  }

  // Get invitation OG image
  let ogImage = 'https://invite.deardrawer.com/og-image.png'
  if (page.invitation_id) {
    try {
      const invitation = await getInvitationById(page.invitation_id)
      if (invitation?.main_image) {
        ogImage = invitation.main_image.startsWith('https://')
          ? invitation.main_image
          : `https://invite.deardrawer.com${invitation.main_image}`
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
    />
  );
}
