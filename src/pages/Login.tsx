import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useStore } from '../store'
import { User } from '../types/auth'

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false)
  const [familyCode, setFamilyCode] = useState('')
  const [pin, setPin] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [parentName, setParentName] = useState('')
  const [error, setError] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[] | null>(null)
  
  const navigate = useNavigate()
  const setAuth = useStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isRegistering) {
        const res = await register(familyName, pin, parentName)
        setAuth(res)
        alert(`Family Registered! Your Family Code is: ${res.family.familyCode}`)
        setIsRegistering(false)
        navigate('/')
      } else {
        const res = await login(familyCode, pin)
        if (res.user) {
          setAuth(res as any) // Type assertion if needed, but LoginResponse handles optional user
          navigate('/')
        } else if (res.family.members) {
          setAvailableUsers(res.family.members)
        } else {
          setError('No members found in family')
        }
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUserSelect = async (userId: string) => {
    try {
      const res = await login(familyCode, pin, userId)
      if (res.user) {
        setAuth(res as any)
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (availableUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-teal-600">Select User</h1>
          <div className="grid grid-cols-2 gap-4">
            {availableUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-teal-50 hover:border-teal-500 transition-colors"
              >
                <div className="text-4xl mb-2">{user.avatar || '👤'}</div>
                <div className="font-medium text-gray-800">{user.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setAvailableUsers(null)}
            className="mt-6 w-full text-gray-500 hover:text-gray-700 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-teal-600">
          {isRegistering ? 'Create Family' : 'Family Login'}
        </h1>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Family Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Family Code</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {isRegistering ? 'Create PIN (4-6 digits)' : 'Family PIN'}
            </label>
            <input
              type="password"
              required
              pattern="[0-9]{4,6}"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-teal-600 hover:text-teal-500"
          >
            {isRegistering ? 'Already have a family? Login' : 'Create a new family'}
          </button>
        </div>
      </div>
    </div>
  )
}
