import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { AllowanceTransaction } from '../types'
import { distributeAllowance, getAllowanceTransactions } from '../api'

export const Allowance = () => {
  const { user, family, token } = useStore()
  const [transactions, setTransactions] = useState<AllowanceTransaction[]>([])
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])

  useEffect(() => {
    if (token) {
      getAllowanceTransactions(token)
        .then(setTransactions)
        .catch(console.error)
    }
  }, [token])

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !user || user.role !== 'parent') return

    try {
      await distributeAllowance(
        token,
        Number(amount),
        { spend: 50, save: 30, give: 20 }, // Default split 50/30/20
        selectedChildren,
        notes
      )
      alert('Allowance distributed!')
      setAmount('')
      setNotes('')
      setSelectedChildren([])
      // Refresh transactions
      getAllowanceTransactions(token).then(setTransactions)
    } catch (error) {
      console.error(error)
      alert('Failed to distribute allowance')
    }
  }

  const toggleChild = (id: string) => {
    if (selectedChildren.includes(id)) {
      setSelectedChildren(selectedChildren.filter(c => c !== id))
    } else {
      setSelectedChildren([...selectedChildren, id])
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-teal-700 mb-6">Allowance & Jars</h1>

      {user?.role === 'child' && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <h3 className="font-bold text-blue-800">Spend</h3>
            <p className="text-2xl font-bold text-blue-900">${user.jars.spend.toFixed(2)}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <h3 className="font-bold text-green-800">Save</h3>
            <p className="text-2xl font-bold text-green-900">${user.jars.save.toFixed(2)}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg text-center">
            <h3 className="font-bold text-purple-800">Give</h3>
            <p className="text-2xl font-bold text-purple-900">${user.jars.give.toFixed(2)}</p>
          </div>
        </div>
      )}

      {user?.role === 'parent' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-teal-100">
          <h2 className="text-lg font-bold mb-4">Distribute Allowance</h2>
          <form onSubmit={handleDistribute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Children</label>
              <div className="flex flex-wrap gap-2">
                {family?.members?.filter(m => m.role === 'child').map(child => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleChild(child.id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      selectedChildren.includes(child.id)
                        ? 'bg-teal-100 border-teal-500 text-teal-700'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    {child.avatar} {child.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Note</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedChildren.length === 0}
              className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              Distribute (50% Spend / 30% Save / 20% Give)
            </button>
          </form>
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Transaction History</h2>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">No transactions yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map(txn => (
                <tr key={txn.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {txn.user?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {txn.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    ${Number(txn.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    S: ${txn.jarDistribution.spend.toFixed(2)} / 
                    Sv: ${txn.jarDistribution.save.toFixed(2)} / 
                    G: ${txn.jarDistribution.give.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
