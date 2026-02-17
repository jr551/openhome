import { User } from './auth'

export interface Chore {
  id: string
  title: string
  description: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
  schedule: {
    frequency: 'daily' | 'weekly' | 'one-time'
    days?: number[] // 0-6 for weekly
  }
  photos: string[]
  isActive: boolean
  assignments: ChoreAssignment[]
}

export interface ChoreAssignment {
  id: string
  choreId: string
  userId: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
  dueDate?: string
  user: User
  completions: ChoreCompletion[]
}

export interface ChoreCompletion {
  id: string
  assignmentId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  beforePhotos: string[]
  afterPhotos: string[]
  notes?: string
  submittedAt: string
  approvedAt?: string
}

export interface AllowanceTransaction {
  id: string
  userId: string
  type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  jarDistribution: {
    spend: number
    save: number
    give: number
  }
  source?: string
  createdAt: string
  user: User
}

export interface Reward {
  id: string
  title: string
  description: string
  pointCost: number
  photos: string[]
  stock?: number
  isActive: boolean
}

export interface ChatMessage {
  id: string
  userId: string
  content: string
  type: 'text' | 'image' | 'system'
  attachments: string[]
  createdAt: string
  user: User
}
