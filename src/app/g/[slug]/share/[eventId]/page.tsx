import { getPageBySlug, getEventById, getGuestsByEventId, getVenuesByPageId } from "@/lib/geunnalDb";
import { notFound } from "next/navigation";
import GuestEventClient from "./GuestEventClient";
import type { Viewport, Metadata } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface PageProps {
  params: Promise<{ slug: string; eventId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};
  const title = `${page.groom_name} & ${page.bride_name} 모임 초대`;
  const description = `${page.groom_name} & ${page.bride_name} 청첩장 모임에 초대합니다.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function GuestSharePage({ params }: PageProps) {
  const { slug, eventId } = await params;

  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const event = await getEventById(eventId);
  if (!event || event.page_id !== page.id) notFound();

  // Fetch guests and venue in parallel
  const [guests, venues] = await Promise.all([
    getGuestsByEventId(eventId),
    getVenuesByPageId(page.id),
  ]);

  const venue = venues.find(v => v.event_id === eventId) || null;

  return (
    <GuestEventClient
      eventId={event.id}
      eventName={event.name}
      eventDate={event.date}
      eventTime={event.time}
      eventLocation={event.location}
      eventSide={event.side}
      eventArea={event.area || ''}
      eventRestaurant={event.restaurant || ''}
      guests={guests.map(g => g.name)}
      groomName={page.groom_name}
      brideName={page.bride_name}
      weddingDate={page.wedding_date}
      slug={slug}
      venueName={venue?.name}
      venueAddress={venue?.address}
      venueLat={venue?.lat}
      venueLng={venue?.lng}
    />
  );
}
