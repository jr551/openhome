import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { request } from '../api/client'
import { useNavigate } from 'react-router'
import { registerMember } from '../api/auth'
import { Plus } from 'lucide-react'
import { Family, User } from '../types/auth'

export const Dashboard = () => {
  const { user, family, token, setAuth } = useStore()
  const [chores, setChores] = useState<any[]>([])
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'child' | 'parent'>('child')
  
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    
    if (token) {
      request('/chores', { token })
        .then((data: any) => setChores(data))
        .catch(err => console.error(err))
    }
  }, [token, navigate])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      await registerMember(token, newMemberName, newMemberRole)
      // Refresh family data from the server so new member appears immediately
      const meData = await request<{ user: User; family: Family }>('/auth/me', { token })
      if (meData.family) {
        setAuth({ token, user: meData.user || user!, family: meData.family })
      }
      setIsAddingMember(false)
      setNewMemberName('')
      alert(`${newMemberName} added to the family!`)
    } catch (error) {
      console.error(error)
      alert('Failed to add member')
    }
  }

  if (!family) {
    return <div>Loading...</div>
  }

  if (!user) {
      return (
          <div className="p-4">
              <h1 className="text-2xl font-bold">Select Profile</h1>
              <div className="grid grid-cols-2 gap-4 mt-4">
                  {family.members?.map(member => (
                      <div
                        key={member.id}
                        className="border p-4 rounded text-center cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                            // Issue #7: UI bug: Dashboard 'Select Profile' screen has no selection handler
                            // Question: Should there be a PIN verification for each profile, or is family-level PIN enough?
                            if (token && family) {
                                setAuth({ token, family, user: member })
                            }
                        }}
                      >
                          <div className="text-4xl">{member.avatar}</div>
                          <div className="mt-2 font-bold">{member.name}</div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-teal-700">Welcome, {user.name}!</h1>
            <p className="text-gray-600">{family.name} (Code: {family.familyCode})</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-800 font-bold">
                {user.points} Points
            </div>
            {user.role === 'parent' && (
                <button 
                    onClick={() => setIsAddingMember(true)}
                    className="bg-teal-600 text-white p-2 rounded-full shadow hover:bg-teal-700"
                    title="Add Family Member"
                >
                    <Plus size={20} />
                </button>
            )}
        </div>
      </header>

      {isAddingMember && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-teal-100">
            <h3 className="font-bold text-lg mb-4">Add Family Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input 
                        type="text" 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        value={newMemberName}
                        onChange={e => setNewMemberName(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        value={newMemberRole}
                        onChange={e => setNewMemberRole(e.target.value as any)}
                    >
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2">
                    <button 
                        type="button" 
                        onClick={() => setIsAddingMember(false)}
                        className="px-4 py-2 text-gray-600"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-teal-600 text-white rounded-md"
                    >
                        Add Member
                    </button>
                </div>
            </form>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Family Chores</h2>
        {chores.length === 0 ? (
            <p className="text-gray-500">No chores found.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chores.map((chore) => (
                <div key={chore.id} className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg">{chore.title}</h3>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">{chore.points} pts</span>
                </div>
                <p className="text-gray-600 mt-2 text-sm">{chore.description}</p>
                <div className="mt-4 flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                        chore.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                        chore.difficulty === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        {chore.difficulty}
                    </span>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  )
}
