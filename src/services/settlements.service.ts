import SupabaseService from './supabase.service'
import type { Tables } from './supabase.service'

export class SettlementsService {
  static async getSettlements(userId: string) {
    return SupabaseService.get('settlements', {
      eq: { from_user_id: userId },
      order: { column: 'created_at', ascending: false }
    })
  }

  static async getSettlement(id: string) {
    const settlements = await SupabaseService.get('settlements', {
      eq: { id }
    })
    return settlements[0]
  }

  static async createSettlement(settlement: Tables['settlements']['Insert']) {
    return SupabaseService.create('settlements', settlement)
  }

  static async updateSettlement(id: string, settlement: Partial<Tables['settlements']['Update']>) {
    return SupabaseService.update('settlements', id, settlement)
  }

  static async deleteSettlement(id: string) {
    return SupabaseService.delete('settlements', id)
  }

  static async getPendingSettlements(userId: string) {
    return SupabaseService.get('settlements', {
      eq: { from_user_id: userId, status: 'pending' },
      order: { column: 'created_at', ascending: false }
    })
  }

  static async getCompletedSettlements(userId: string) {
    return SupabaseService.get('settlements', {
      eq: { from_user_id: userId, status: 'completed' },
      order: { column: 'created_at', ascending: false }
    })
  }

  static subscribeToSettlements(callback: (_payload: {
    new: Tables['settlements']['Row'] | null
    old: Tables['settlements']['Row'] | null
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  }) => void) {
    return SupabaseService.subscribe('settlements', callback)
  }
}

export default SettlementsService 