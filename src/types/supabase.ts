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
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          photo_url: string | null
          created_at: string
          provider: string | null
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          photo_url?: string | null
          created_at?: string
          provider?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          photo_url?: string | null
          created_at?: string
          provider?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string | null
          date: string
          paid_by: string
          category_id: string | null
          location_id: string | null
          created_at: string
          updated_at: string
          participants: Json | null
          notes: string | null
          month: string // YYYY-MM format
        }
        Insert: {
          id?: string
          amount: number
          description?: string | null
          date: string
          paid_by: string
          category_id?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
          participants?: Json | null
          notes?: string | null
          month: string // YYYY-MM format
        }
        Update: {
          id?: string
          amount?: number
          description?: string | null
          date?: string
          paid_by?: string
          category_id?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
          participants?: Json | null
          notes?: string | null
          month?: string // YYYY-MM format
        }
      }
      settlements: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          amount: number
          date: string
          status: string
          created_at: string
          month: string // YYYY-MM format
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          amount: number
          date: string
          status: string
          created_at?: string
          month: string // YYYY-MM format
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          date?: string
          status?: string
          created_at?: string
          month?: string // YYYY-MM format
        }
      }
      recurring: {
        Row: {
          id: string
          amount: number
          description: string | null
          frequency: string
          next_due_date: string
          user_id: string
          category_id: string | null
          location_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          description?: string | null
          frequency: string
          next_due_date: string
          user_id: string
          category_id?: string | null
          location_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string | null
          frequency?: string
          next_due_date?: string
          user_id?: string
          category_id?: string | null
          location_id?: string | null
          created_at?: string
        }
      }
    }
  }
} 