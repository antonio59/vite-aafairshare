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
          uid: string | null
          is_anonymous: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username?: string | null
          photo_url?: string | null
          created_at?: string
          uid?: string | null
          is_anonymous?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          photo_url?: string | null
          created_at?: string
          uid?: string | null
          is_anonymous?: boolean | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string | null
          icon: string | null
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          icon?: string | null
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          icon?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          location_id: string | null
          month: string
          paid_by_id: string | null
          split_type: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          location_id?: string | null
          month: string
          paid_by_id?: string | null
          split_type?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          location_id?: string | null
          month?: string
          paid_by_id?: string | null
          split_type?: string | null
          updated_at?: string | null
        }
      }
      settlements: {
        Row: {
          id: string
          amount: number
          created_at: string | null
          date: string
          from_user_id: string | null
          month: string
          notes: string | null
          recorded_by: string | null
          to_user_id: string | null
        }
        Insert: {
          id?: string
          amount: number
          created_at?: string | null
          date: string
          from_user_id?: string | null
          month: string
          notes?: string | null
          recorded_by?: string | null
          to_user_id?: string | null
        }
        Update: {
          id?: string
          amount?: number
          created_at?: string | null
          date?: string
          from_user_id?: string | null
          month?: string
          notes?: string | null
          recorded_by?: string | null
          to_user_id?: string | null
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
    Views: unknown,
    Functions: unknown,
    Enums: unknown
  }
} 