import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Chores } from './pages/Chores'
import { Allowance } from './pages/Allowance'
import { Rewards } from './pages/Rewards'
import { Chat } from './pages/Chat'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chores" element={<Chores />} />
            <Route path="/allowance" element={<Allowance />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
