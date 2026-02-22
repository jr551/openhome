import { Outlet, Link, useLocation } from 'react-router'
import { Home, CheckSquare, Coins, Gift, MessageCircle, LogOut } from 'lucide-react'
import { useStore } from '../store'

export const Layout = () => {
  const location = useLocation()
  const logout = useStore(state => state.logout)

  const isActive = (path: string) => location.pathname === path ? 'text-teal-600' : 'text-gray-500'

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50 md:hidden">
        <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link to="/chores" className={`flex flex-col items-center ${isActive('/chores')}`}>
          <CheckSquare size={24} />
          <span className="text-xs mt-1">Chores</span>
        </Link>
        <Link to="/allowance" className={`flex flex-col items-center ${isActive('/allowance')}`}>
          <Coins size={24} />
          <span className="text-xs mt-1">Wallet</span>
        </Link>
        <Link to="/rewards" className={`flex flex-col items-center ${isActive('/rewards')}`}>
          <Gift size={24} />
          <span className="text-xs mt-1">Shop</span>
        </Link>
        <Link to="/chat" className={`flex flex-col items-center ${isActive('/chat')}`}>
          <MessageCircle size={24} />
          <span className="text-xs mt-1">Chat</span>
        </Link>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col p-4 z-50">
        <h1 className="text-2xl font-bold text-teal-600 mb-8 px-4">OpenHome</h1>
        <div className="space-y-2">
            <Link to="/" className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 ${isActive('/')}`}>
            <Home size={24} />
            <span>Dashboard</span>
            </Link>
            <Link to="/chores" className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 ${isActive('/chores')}`}>
            <CheckSquare size={24} />
            <span>Chores</span>
            </Link>
            <Link to="/allowance" className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 ${isActive('/allowance')}`}>
            <Coins size={24} />
            <span>Allowance</span>
            </Link>
            <Link to="/rewards" className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 ${isActive('/rewards')}`}>
            <Gift size={24} />
            <span>Rewards</span>
            </Link>
            <Link to="/chat" className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 ${isActive('/chat')}`}>
            <MessageCircle size={24} />
            <span>Family Chat</span>
            </Link>
        </div>
        <div className="mt-auto">
            <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 w-full text-left">
                <LogOut size={24} />
                <span>Logout</span>
            </button>
        </div>
      </nav>
      
      <div className="md:pl-64 min-h-screen">
        <main className="container mx-auto px-4 py-4 max-w-4xl">
            <Outlet />
        </main>
      </div>
    </div>
  )
}
