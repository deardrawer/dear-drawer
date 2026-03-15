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

function formatOgDate(dateStr: string): string {
  if (!dateStr || dateStr === 'TBD') return ''
  const d = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]})`
}

function formatOgTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m > 0 ? `${period} ${hour}시 ${m}분` : `${period} ${hour}시`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, eventId } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};
  const event = await getEventById(eventId);

  const title = `${page.groom_name} & ${page.bride_name} 청첩장 모임에 초대합니다`;
  const descParts: string[] = []
  if (event?.date) descParts.push(formatOgDate(event.date))
  if (event?.time) descParts.push(formatOgTime(event.time))
  const location = [event?.area, event?.restaurant].filter(Boolean).join(' ')
  if (location) descParts.push(location)
  const description = descParts.join(' · ') || `${page.groom_name} & ${page.bride_name}의 모임`

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
