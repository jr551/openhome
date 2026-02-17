import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store'
import { getChatHistory, sendMessage } from '../api'
import { ChatMessage } from '../types'
import { io, Socket } from 'socket.io-client'
import { Send } from 'lucide-react'

export const Chat = () => {
  const { user, token } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [content, setContent] = useState('')
  const [_socket, setSocket] = useState<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!token) return

    // Fetch history
    getChatHistory(token).then(setMessages).catch(console.error)

    // Connect socket
    // Issue #5: Bug: Chat socket client hardcoded to http://localhost:3001
    // Question: Should we use VITE_API_URL or default to current origin?
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin)

    const newSocket = io(socketUrl, {
      auth: { token }
    })

    newSocket.on('message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !token) return

    try {
      // Optimistic update could go here, but let's wait for socket/response for simplicity
      await sendMessage(token, content)
      setContent('')
    } catch (error) {
      console.error(error)
      alert('Failed to send message')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-40px)]">
      <h1 className="text-2xl font-bold text-teal-700 mb-4 px-4 pt-4">Family Chat</h1>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg mx-4 mb-4 border">
        {messages.map((msg, index) => {
          const isMe = msg.userId === user?.id
          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg p-3 ${
                isMe ? 'bg-teal-600 text-white' : 'bg-white border text-gray-800'
              }`}>
                {!isMe && <div className="text-xs text-gray-500 mb-1">{msg.user?.name}</div>}
                <p>{msg.content}</p>
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-teal-500"
          placeholder="Type a message..."
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <button
          type="submit"
          disabled={!content.trim()}
          className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}
