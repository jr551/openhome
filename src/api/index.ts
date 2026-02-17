import { request } from './client'
import { AllowanceTransaction, Reward, ChatMessage } from '../types/index'

// Allowance
export const getAllowanceTransactions = async (token: string) => {
  return request<AllowanceTransaction[]>('/allowance', { token })
}

export const distributeAllowance = async (
  token: string,
  amount: number,
  distribution: { spend: number; save: number; give: number },
  userIds: string[],
  notes?: string
) => {
  return request('/allowance/distribute', {
    method: 'POST',
    token,
    body: JSON.stringify({ amount, distribution, userIds, notes }),
  })
}

// Rewards
export const getRewards = async (token: string) => {
  return request<Reward[]>('/rewards', { token })
}

export const createReward = async (token: string, data: any) => {
  return request<Reward>('/rewards', {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

export const redeemReward = async (token: string, rewardId: string) => {
  return request(`/rewards/${rewardId}/redeem`, {
    method: 'POST',
    token,
  })
}

// Chat
export const getChatHistory = async (token: string) => {
  return request<ChatMessage[]>('/chat', { token })
}

export const sendMessage = async (token: string, content: string, attachments?: string[]) => {
  return request<ChatMessage>('/chat', {
    method: 'POST',
    token,
    body: JSON.stringify({ content, attachments }),
  })
}
