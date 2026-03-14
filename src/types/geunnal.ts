// Geunnal (그날) - Wedding event management types

export interface GeunnalPage {
  id: string
  invitation_id: string | null
  slug: string
  groom_name: string
  bride_name: string
  wedding_date: string | null
  wedding_time: string | null
  venue_name: string | null
  venue_address: string | null
  password_hash: string | null
  last_login_at: string | null
  login_count: number
  created_at: string
  updated_at: string
}

export type EventSide = 'groom' | 'bride' | 'both'
export type MealType = 'lunch' | 'dinner' | 'other'

export interface GeunnalEvent {
  id: string
  page_id: string
  name: string
  date: string
  time: string
  location: string | null
  map_url: string | null
  expected_guests: number
  total_cost: number | null
  side: EventSide
  area: string
  restaurant: string
  meal_type: MealType
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EventGuest {
  id: string
  event_id: string
  name: string
  contacted: number // 0 or 1
  created_at: string
}

export interface GeunnalSubmission {
  id: string
  event_id: string
  guest_name: string
  is_anonymous: number // 0 or 1
  avatar_id: number
  message: string | null
  photo_url: string | null
  created_at: string
}

export type VenueRating = 'good' | 'hold' | 'bad'
export type ReservationStatus = 'available' | 'unavailable' | 'unknown'

export interface GeunnalVenue {
  id: string
  page_id: string
  name: string
  address: string
  area: string
  lat: number
  lng: number
  rating: VenueRating
  reservation_status: ReservationStatus
  price_range: string | null
  menu_notes: string | null
  phone: string | null
  event_id: string | null
  created_at: string
  updated_at: string
}

// Input types for create/update operations
export interface GeunnalPageInput {
  invitation_id?: string | null
  slug?: string
  groom_name?: string
  bride_name?: string
  wedding_date?: string | null
  wedding_time?: string | null
  venue_name?: string | null
  venue_address?: string | null
  password_hash?: string | null
}

export interface GeunnalEventInput {
  page_id?: string
  name?: string
  date?: string
  time?: string
  location?: string | null
  map_url?: string | null
  expected_guests?: number
  total_cost?: number | null
  side?: EventSide
  area?: string
  restaurant?: string
  meal_type?: MealType
  sort_order?: number
}

export interface GeunnalVenueInput {
  page_id?: string
  name?: string
  address?: string
  area?: string
  lat?: number
  lng?: number
  rating?: VenueRating
  reservation_status?: ReservationStatus
  price_range?: string | null
  menu_notes?: string | null
  phone?: string | null
  event_id?: string | null
}
