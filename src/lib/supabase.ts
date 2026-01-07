import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create untyped client for now - will use Database type when Supabase is properly configured
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          user_id: string
          template_id: string
          title: string
          groom_name: string
          bride_name: string
          wedding_date: string
          wedding_time: string
          venue_name: string
          venue_address: string
          venue_map_url: string | null
          main_image_url: string | null
          gallery_images: string[]
          greeting_message: string
          account_info: AccountInfo | null
          custom_styles: CustomStyles | null
          slug: string
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          title: string
          groom_name: string
          bride_name: string
          wedding_date: string
          wedding_time: string
          venue_name: string
          venue_address: string
          venue_map_url?: string | null
          main_image_url?: string | null
          gallery_images?: string[]
          greeting_message: string
          account_info?: AccountInfo | null
          custom_styles?: CustomStyles | null
          slug: string
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          template_id?: string
          title?: string
          groom_name?: string
          bride_name?: string
          wedding_date?: string
          wedding_time?: string
          venue_name?: string
          venue_address?: string
          venue_map_url?: string | null
          main_image_url?: string | null
          gallery_images?: string[]
          greeting_message?: string
          account_info?: AccountInfo | null
          custom_styles?: CustomStyles | null
          slug?: string
          is_published?: boolean
          updated_at?: string
        }
      }
      rsvp_responses: {
        Row: {
          id: string
          invitation_id: string
          guest_name: string
          guest_phone: string | null
          attendance: 'attending' | 'not_attending' | 'pending'
          guest_count: number
          meal_preference: string | null
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invitation_id: string
          guest_name: string
          guest_phone?: string | null
          attendance: 'attending' | 'not_attending' | 'pending'
          guest_count?: number
          meal_preference?: string | null
          message?: string | null
          created_at?: string
        }
        Update: {
          guest_name?: string
          guest_phone?: string | null
          attendance?: 'attending' | 'not_attending' | 'pending'
          guest_count?: number
          meal_preference?: string | null
          message?: string | null
        }
      }
      page_views: {
        Row: {
          id: string
          invitation_id: string
          visitor_ip: string | null
          user_agent: string | null
          referrer: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          invitation_id: string
          visitor_ip?: string | null
          user_agent?: string | null
          referrer?: string | null
          viewed_at?: string
        }
        Update: never
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// Custom Types
export type AccountInfo = {
  groom_bank?: string
  groom_account?: string
  groom_holder?: string
  bride_bank?: string
  bride_account?: string
  bride_holder?: string
}

export type CustomStyles = {
  primary_color?: string
  secondary_color?: string
  font_family?: string
  background_pattern?: string
}

// Table Row Types
export type User = Database['public']['Tables']['users']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type RSVPResponse = Database['public']['Tables']['rsvp_responses']['Row']
export type PageView = Database['public']['Tables']['page_views']['Row']

// Insert Types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert']
export type RSVPResponseInsert = Database['public']['Tables']['rsvp_responses']['Insert']
export type PageViewInsert = Database['public']['Tables']['page_views']['Insert']
