import { getPageBySlug } from "@/lib/geunnalDb";
import { notFound } from "next/navigation";
import GeunnalClient from "./GeunnalClient";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    />
  );
}
