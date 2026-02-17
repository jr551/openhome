import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { request } from '../api/client'
import { Chore, ChoreCompletion } from '../types'
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react'

export const Chores = () => {
  const { user, family, token } = useStore()
  const [chores, setChores] = useState<Chore[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(10)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [assignees, setAssignees] = useState<string[]>([])

  const fetchChores = () => {
    if (token) {
      request<Chore[]>('/chores', { token })
        .then(setChores)
        .catch(console.error)
    }
  }

  useEffect(() => {
    fetchChores()
  }, [token])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      await request<Chore>('/chores', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title,
          description,
          points: Number(points),
          difficulty,
          schedule: { frequency: 'daily' }, // Default for now
          assignees
        })
      })
      fetchChores()
      setIsCreating(false)
      // Reset form
      setTitle('')
      setDescription('')
      setPoints(10)
      setAssignees([])
    } catch (error) {
      console.error('Failed to create chore', error)
      alert('Failed to create chore')
    }
  }

  const toggleAssignee = (userId: string) => {
    if (assignees.includes(userId)) {
      setAssignees(assignees.filter(id => id !== userId))
    } else {
      setAssignees([...assignees, userId])
    }
  }

  const handleComplete = async (choreId: string) => {
    if (!token) return
    const notes = prompt('Any notes? (Optional)')
    try {
      await request(`/chores/${choreId}/complete`, {
        method: 'POST',
        token,
        body: JSON.stringify({ notes })
      })
      alert('Chore marked as completed!')
      fetchChores()
    } catch (error) {
      console.error(error)
      alert('Failed to mark complete')
    }
  }

  const handleApprove = async (completionId: string, approved: boolean) => {
    if (!token) return
    if (!confirm(approved ? 'Approve this chore and award points?' : 'Reject this chore completion?')) return

    try {
        // API expects choreId in path but it might be just a placeholder if we pass completionId in body
        // The route is /:id/approve. Let's use a dummy ID or the actual chore ID if we have it.
        // Looking at the route implementation, it uses req.params.id but doesn't really rely on it if completionId is in body?
        // Wait, route implementation: 
        // const { id } = req.params
        // const { completionId, approved } = req.body
        // It DOES NOT use `id` for lookup, only `completionId`.
        // So we can use any ID in the path. Let's use 'action' or the actual chore ID if available in context.
        // Since I don't have choreId easily accessible in the map loop without passing it down, I'll use 'action'.
      await request(`/chores/action/approve`, {
        method: 'POST',
        token,
        body: JSON.stringify({ completionId, approved })
      })
      alert(approved ? 'Chore approved!' : 'Chore rejected')
      fetchChores()
    } catch (error) {
      console.error(error)
      alert('Action failed')
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-teal-700">Chores</h1>
        {user?.role === 'parent' && (
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-teal-100">
          <h2 className="text-lg font-bold mb-4">Create New Chore</h2>
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
                <label className="block text-sm font-medium text-gray-700">Points</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
              <div className="flex flex-wrap gap-2">
                {family?.members?.filter(m => m.role === 'child').map(child => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleAssignee(child.id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      assignees.includes(child.id) 
                        ? 'bg-teal-100 border-teal-500 text-teal-700' 
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {child.avatar} {child.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Create Chore
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {chores.map(chore => {
            const myAssignment = user ? chore.assignments?.find(a => a.userId === user.id) : null
            const isAssignedToMe = !!myAssignment
            const isPendingMyAction = isAssignedToMe && myAssignment?.status === 'pending'
            
            // Find pending completions for parent to review
            const pendingCompletions: ChoreCompletion[] = []
            chore.assignments?.forEach(a => {
                a.completions?.forEach(c => {
                    if (c.status === 'pending') {
                        pendingCompletions.push(c)
                    }
                })
            })

            return (
          <div key={chore.id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg">{chore.title}</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                {chore.points} 🪙
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{chore.description}</p>
            
            <div className="mt-3 flex flex-wrap gap-2">
               <span className={`text-xs px-2 py-1 rounded capitalize ${
                  chore.difficulty === 'hard' ? 'bg-red-50 text-red-700' :
                  chore.difficulty === 'medium' ? 'bg-blue-50 text-blue-700' :
                  'bg-green-50 text-green-700'
               }`}>
                 {chore.difficulty}
               </span>
               <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 capitalize">
                 {chore.schedule.frequency}
               </span>
            </div>

            {chore.assignments && chore.assignments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Assigned to:</p>
                <div className="flex gap-2 flex-wrap">
                  {chore.assignments.map(a => (
                    <div key={a.id} className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-1 rounded border">
                      <span>{a.user?.avatar || '👤'}</span>
                      <span>{a.user?.name || 'Unknown'}</span>
                      <span className={`w-2 h-2 rounded-full ml-1 ${
                        a.status === 'completed' ? 'bg-blue-500' :
                        a.status === 'approved' ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`} title={a.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Child Actions */}
            {isPendingMyAction && (
                <div className="mt-4">
                    <button 
                        onClick={() => handleComplete(chore.id)}
                        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 flex justify-center items-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Mark as Complete
                    </button>
                </div>
            )}

            {/* Parent Actions - Review Pending Completions */}
            {user?.role === 'parent' && pendingCompletions.length > 0 && (
                <div className="mt-4 bg-orange-50 p-3 rounded-md border border-orange-200">
                    <p className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1">
                        <Clock size={12} /> Pending Approval ({pendingCompletions.length})
                    </p>
                    {pendingCompletions.map(c => {
                        // Find user for this completion
                        // assignmentId -> assignment -> user
                        // We need to look up assignment in chore.assignments
                        const assignment = chore.assignments.find(a => a.id === c.assignmentId)
                        const userName = assignment?.user?.name || 'Unknown'
                        
                        return (
                            <div key={c.id} className="flex justify-between items-center mb-2 last:mb-0">
                                <span className="text-xs">{userName}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleApprove(c.id, true)}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                                        title="Approve"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(c.id, false)}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        title="Reject"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

          </div>
        )})}
      </div>
    </div>
  )
}
