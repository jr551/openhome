import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useStore } from '../store'

export const useSocket = () => {
  const { token } = useStore()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!token) return

    // Determine socket URL dynamically
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin)

    const newSocket = io(socketUrl, {
      auth: { token }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [token])

  return socket
}
