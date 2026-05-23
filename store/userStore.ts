import { create } from 'zustand'
import type { User } from '@/types'

interface UserStore {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    fetch('/api/auth/me', { method: 'DELETE' }).catch(console.error)
    set({ user: null, isAuthenticated: false })
  },
}))
