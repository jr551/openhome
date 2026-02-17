import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { request } from '../api/client'
import { Reward } from '../types'
import { createReward, getRewards, redeemReward } from '../api'
import { Plus, Gift } from 'lucide-react'

export const Rewards = () => {
  const { user, family, token } = useStore()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointCost, setPointCost] = useState(50)
  const [stock, setStock] = useState('')

  useEffect(() => {
    if (token) {
      getRewards(token)
        .then(setRewards)
        .catch(console.error)
    }
  }, [token])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      const newReward = await createReward(token, {
        title,
        description,
        pointCost: Number(pointCost),
        stock: stock ? Number(stock) : undefined
      })
      setRewards([...rewards, newReward])
      setIsCreating(false)
      setTitle('')
      setDescription('')
      setPointCost(50)
      setStock('')
    } catch (error) {
      console.error(error)
      alert('Failed to create reward')
    }
  }

  const handleRedeem = async (reward: Reward) => {
    if (!token || !user) return
    if (user.points < reward.pointCost) {
      alert('Not enough points!')
      return
    }
    if (confirm(`Redeem "${reward.title}" for ${reward.pointCost} points?`)) {
      try {
        await redeemReward(token, reward.id)
        alert('Reward redeemed! Check your email/notifications.')
        // Optimistic update
        // In real app, re-fetch user to update points
        window.location.reload() 
      } catch (error: any) {
        console.error(error)
        alert(error.message || 'Redemption failed')
      }
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-teal-700">Rewards Shop</h1>
        {user?.role === 'parent' && (
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {user?.role === 'child' && (
        <div className="bg-orange-100 p-4 rounded-lg mb-6 flex justify-between items-center">
          <span className="text-orange-800 font-bold">Your Balance</span>
          <span className="text-2xl font-bold text-orange-900">{user.points} 🪙</span>
        </div>
      )}

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-teal-100">
          <h2 className="text-lg font-bold mb-4">Add New Reward</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Point Cost</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={pointCost}
                  onChange={e => setPointCost(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Stock (Optional)</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md">Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(reward => (
          <div key={reward.id} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col">
            <div className="flex justify-center mb-4 text-teal-100">
                <Gift size={64} className="text-teal-500" />
            </div>
            <h3 className="font-bold text-lg text-center">{reward.title}</h3>
            <p className="text-gray-600 text-sm text-center mt-1 flex-1">{reward.description}</p>
            
            <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    {reward.stock !== null ? `${reward.stock} left` : 'Unlimited'}
                </div>
                <div className="font-bold text-orange-600">{reward.pointCost} 🪙</div>
            </div>

            {user?.role === 'child' && (
                <button
                    onClick={() => handleRedeem(reward)}
                    disabled={user.points < reward.pointCost || (reward.stock !== null && reward.stock <= 0)}
                    className="mt-4 w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Redeem
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
