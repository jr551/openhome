import { request } from './client'
import { LoginResponse, RegisterResponse, User } from '../types/auth'

export const login = async (familyCode: string, pin: string, userId?: string) => {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ familyCode, pin, userId }),
  })
}

export const register = async (familyName: string, pin: string, parentName: string) => {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ familyName, pin, parentName }),
  })
}

export const refresh = async (refreshToken: string) => {
  return request<{ token: string }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export const registerMember = async (token: string, name: string, role: 'parent' | 'child', avatar?: string) => {
  return request<User>('/auth/register-member', {
    method: 'POST',
    token,
    body: JSON.stringify({ name, role, avatar }),
  })
}
