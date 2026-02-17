export interface User {
  id: string
  familyId: string
  name: string
  role: 'parent' | 'child'
  avatar: string
  points: number
  streak: number
  jars: {
    spend: number
    save: number
    give: number
  }
}

export interface Family {
  id: string
  familyCode: string
  name: string
  members?: User[]
}

export interface LoginResponse {
  token: string
  refreshToken: string
  family: Family
  user?: User
}

export interface RegisterResponse {
  token: string
  refreshToken: string
  family: Family
  user: User
}
