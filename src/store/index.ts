import { create } from 'zustand'
import { User, Family } from '../types/auth'

interface AuthState {
  token: string | null
  user: User | null
  family: Family | null
  setAuth: (data: { token: string; user?: User; family: Family }) => void
  logout: () => void
}

export const useStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  family: JSON.parse(localStorage.getItem('family') || 'null'),
  setAuth: (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('family', JSON.stringify(data.family))
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    set({ token: data.token, user: data.user || null, family: data.family })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('family')
    localStorage.removeItem('refreshToken')
    set({ token: null, user: null, family: null })
  },
}))
