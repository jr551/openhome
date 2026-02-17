import { Router, type Response } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Get Chat History
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const familyId = req.user!.familyId
    
    const messages = await prisma.chatMessage.findMany({
      where: { familyId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 messages
    })

    const parsedMessages = messages.map(m => ({
        ...m,
        attachments: JSON.parse(m.attachments || '[]')
    })).reverse() // Return in chronological order

    res.json(parsedMessages)
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Send Message
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const familyId = req.user!.familyId
    const userId = req.user!.userId
    const { content, type, attachments } = req.body

    if (!content && (!attachments || attachments.length === 0)) {
        res.status(400).json({ error: 'Message content required' })
        return
    }

    const message = await prisma.chatMessage.create({
      data: {
        familyId,
        userId: userId!,
        content: content || '',
        type: type || 'text',
        attachments: JSON.stringify(attachments || [])
      },
      include: { user: true }
    })
    
    // TODO: Emit socket event here. We need access to IO instance.
    // For now, we will just return the message and let the client poll or we attach IO to req.

    const parsedMessage = {
        ...message,
        attachments: JSON.parse(message.attachments || '[]')
    }

    const io = req.app.get('io')
    if (io) {
        io.to(familyId).emit('message', parsedMessage)
    }

    res.status(201).json(parsedMessage)
  } catch (_error) {
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
