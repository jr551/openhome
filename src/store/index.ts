import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Family } from '../types/auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  family: Family | null
  setAuth: (data: { token: string; refreshToken?: string; user?: User; family: Family }) => void
  logout: () => void
}

export const useStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      family: null,
      setAuth: (data) => {
        set({
          token: data.token,
          refreshToken: data.refreshToken || null,
          user: data.user || null,
          family: data.family
        })
      },
      logout: () => {
        set({ token: null, refreshToken: null, user: null, family: null })
      },
    }),
    {
      name: 'openhome-auth-storage',
    }
  )
)
