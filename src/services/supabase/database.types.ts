export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      menu_items: {
        Row: {
          id: number
          name: string
          description: string | null
          price: string // numeric type in Postgres returns as string
          category: string
          subcategory: string | null
          image_url: string | null
          allergens: Json | null // jsonb type
          is_available: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          price: string | number
          category: string
          subcategory?: string | null
          image_url?: string | null
          allergens?: Json | null
          is_available?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          price?: string | number
          category?: string
          subcategory?: string | null
          image_url?: string | null
          allergens?: Json | null
          is_available?: boolean
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string // uuid
          full_name: string | null
          email: string | null
          favorites: Json | null // jsonb type - array of menu item IDs
          favorite_events: Json | null // jsonb type - array of event IDs
          loyalty_points: string | null // numeric type in Postgres returns as string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          favorites?: Json | null
          favorite_events?: Json | null
          loyalty_points?: string | number | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          favorites?: Json | null
          favorite_events?: Json | null
          loyalty_points?: string | number | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          location: string
          offerings: string[] | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date: string
          location: string
          offerings?: string[] | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          location?: string
          offerings?: string[] | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          response: string | null
          language: 'de' | 'en'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          response?: string | null
          language?: 'de' | 'en'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          response?: string | null
          language?: 'de' | 'en'
          created_at?: string
        }
      }
      angebotskalender_weeks: {
        Row: {
          id: string
          week_number: number
          week_theme: string
          description: string | null
          banner_image_url: string | null
          is_active: boolean
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          week_number: number
          week_theme: string
          description?: string | null
          banner_image_url?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          week_number?: number
          week_theme?: string
          description?: string | null
          banner_image_url?: string | null
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
      }
      angebotskalender_items: {
        Row: {
          id: string
          week_id: string | null
          menu_item_id: number | null
          special_price: string // numeric type in Postgres returns as string
          highlight_badge: string | null
          created_at: string
        }
        Insert: {
          id?: string
          week_id?: string | null
          menu_item_id?: number | null
          special_price: string | number
          highlight_badge?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          week_id?: string | null
          menu_item_id?: number | null
          special_price?: string | number
          highlight_badge?: string | null
          created_at?: string
        }
      }
      gallery_photos: {
        Row: {
          id: string
          category: string
          title: string | null
          description: string | null
          image_url: string
          thumbnail_url: string | null
          is_featured: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          title?: string | null
          description?: string | null
          image_url: string
          thumbnail_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          title?: string | null
          description?: string | null
          image_url?: string
          thumbnail_url?: string | null
          is_featured?: boolean
          display_order?: number
          created_at?: string
        }
      }
      loyalty_codes: {
        Row: {
          id: string
          code: string
          points: number
          valid_until: string | null
          max_uses: number
          current_uses: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          points: number
          valid_until?: string | null
          max_uses?: number
          current_uses?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          points?: number
          valid_until?: string | null
          max_uses?: number
          current_uses?: number
          created_at?: string
        }
      }
      loyalty_transactions: {
        Row: {
          id: string
          user_id: string | null
          code_id: string | null
          points: number
          type: 'earned' | 'redeemed'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          code_id?: string | null
          points: number
          type: 'earned' | 'redeemed'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          code_id?: string | null
          points?: number
          type?: 'earned' | 'redeemed'
          description?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}