import { supabase } from '@/lib/supabase'
import type { User } from '@shared/types'

export class AuthService {
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })

    return { data, error }
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { data, error }
  }

  static async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    return { data, error }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  static async getCurrentUser() {
    const { data: { user: _user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return _user
  }

  static async updateUserProfile(userId: string, updates: {
    username?: string
    photo_url?: string
  }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  static onAuthStateChange(callback: (_user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' && session?.user) {
        const now = new Date().toISOString();
        const _user: User = {
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email || '',
          username: session.user.email?.split('@')[0] || '',
          photoURL: session.user.user_metadata?.avatar_url || null,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || now,
          isAnonymous: false
        };
        callback(_user);
      } else if (_event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
}

export default AuthService 