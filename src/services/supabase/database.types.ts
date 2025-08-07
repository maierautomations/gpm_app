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
          image_url?: string | null
          allergens?: Json | null
          is_available?: boolean
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          favorites: number[] | null // Changed to number[] since menu_items.id is number
          loyalty_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          favorites?: number[] | null
          loyalty_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          favorites?: number[] | null
          loyalty_points?: number
          created_at?: string
          updated_at?: string
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
      loyalty_transactions: {
        Row: {
          id: string
          user_id: string
          points: number
          type: 'earned' | 'redeemed'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points: number
          type: 'earned' | 'redeemed'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points?: number
          type?: 'earned' | 'redeemed'
          description?: string | null
          created_at?: string
        }
      }
      angebotskalender: {
        Row: {
          id: string
          title: string
          description: string | null
          valid_from: string
          valid_until: string
          discount_percentage: number | null
          special_price: number | null
          menu_item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          valid_from: string
          valid_until: string
          discount_percentage?: number | null
          special_price?: number | null
          menu_item_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          valid_from?: string
          valid_until?: string
          discount_percentage?: number | null
          special_price?: number | null
          menu_item_id?: string | null
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