import { Router, type Response } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Get Allowance Transactions
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    // If parent, maybe get all family transactions? For now, let's just get user's or specific user's if param provided
    // But architecture says /api/allowance. Let's assume it returns current user's transactions or all if parent.
    
    const whereClause: any = {}
    if (req.user!.role === 'child') {
        whereClause.userId = userId
    } else {
        whereClause.user = { familyId: req.user!.familyId }
    }

    const transactions = await prisma.allowanceTransaction.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })

    const parsedTransactions = transactions.map(t => ({
      ...t,
      jarDistribution: JSON.parse(t.jarDistribution)
    }))

    res.json(parsedTransactions)
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch allowance transactions' })
  }
})

// Distribute Allowance (Parent Only)
router.post('/distribute', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'parent') {
      res.status(403).json({ error: 'Only parents can distribute allowance' })
      return
    }

    const { amount, distribution, notes: _notes, userIds } = req.body // Expecting userIds to distribute to multiple children

    if (!amount || !distribution || !userIds || !Array.isArray(userIds)) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const results = []

    for (const targetUserId of userIds) {
      // Calculate split
      const spend = amount * (distribution.spend / 100)
      const save = amount * (distribution.save / 100)
      const give = amount * (distribution.give / 100)

      // Transaction
      const transaction = await prisma.$transaction(async (tx) => {
        // Create Transaction Record
        const txn = await tx.allowanceTransaction.create({
          data: {
            userId: targetUserId,
            type: 'deposit',
            amount,
            jarDistribution: JSON.stringify({ spend, save, give }),
            source: 'allowance',
          }
        })

        // Update User Jars
        const user = await tx.user.findUnique({ where: { id: targetUserId } })
        if (!user) throw new Error(`User ${targetUserId} not found`)
        
        const currentJars = JSON.parse(user.jars)
        const newJars = {
            spend: currentJars.spend + spend,
            save: currentJars.save + save,
            give: currentJars.give + give
        }

        await tx.user.update({
            where: { id: targetUserId },
            data: { jars: JSON.stringify(newJars) }
        })

        return txn
      })
      results.push(transaction)
    }

    res.json({ success: true, transactions: results })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to distribute allowance' })
  }
})

export default router
