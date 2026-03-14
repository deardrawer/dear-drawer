import { getPageBySlug, getEventById } from "@/lib/geunnalDb";
import { notFound } from "next/navigation";
import GuestEventClient from "./GuestEventClient";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface PageProps {
  params: Promise<{ slug: string; eventId: string }>;
}

export default async function GuestSharePage({ params }: PageProps) {
  const { slug, eventId } = await params;

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const event = await getEventById(eventId);
  if (!event || event.page_id !== page.id) notFound();

  return (
    <GuestEventClient
      eventId={event.id}
      eventName={event.name}
      eventDate={event.date}
      eventTime={event.time}
      eventLocation={event.location}
      groomName={page.groom_name}
      brideName={page.bride_name}
      weddingDate={page.wedding_date}
      slug={slug}
    />
  );
}
