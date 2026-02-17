import { Router, type Response } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// List Rewards
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const familyId = req.user!.familyId
    const rewards = await prisma.reward.findMany({
      where: { familyId, isActive: true },
    })

    const parsedRewards = rewards.map(r => ({
        ...r,
        photos: JSON.parse(r.photos || '[]')
    }))

    res.json(parsedRewards)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rewards' })
  }
})

// Create Reward (Parent Only)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'parent') {
      res.status(403).json({ error: 'Only parents can create rewards' })
      return
    }

    const { title, description, pointCost, photos, stock } = req.body
    const familyId = req.user!.familyId

    const reward = await prisma.reward.create({
      data: {
        familyId,
        title,
        description,
        pointCost: Number(pointCost),
        photos: JSON.stringify(photos || []),
        stock: stock ? Number(stock) : null
      }
    })

    res.status(201).json(reward)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reward' })
  }
})

// Redeem Reward (Child)
router.post('/:id/redeem', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    if (!userId) { // Should always be there if authenticated
        res.status(400).json({ error: 'User ID required' })
        return
    }

    // Transaction to check points and deduct
    const result = await prisma.$transaction(async (tx) => {
        const reward = await tx.reward.findUnique({ where: { id } })
        if (!reward) throw new Error('Reward not found')
        
        if (reward.stock !== null && reward.stock <= 0) {
            throw new Error('Out of stock')
        }

        const user = await tx.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error('User not found')

        if (user.points < reward.pointCost) {
            throw new Error('Insufficient points')
        }

        // Create Redemption
        const redemption = await tx.rewardRedemption.create({
            data: {
                rewardId: id,
                userId,
                status: 'pending' // Needs parent approval? Or auto-approved? Let's say pending for now.
            }
        })

        // Deduct points
        await tx.user.update({
            where: { id: userId },
            data: { points: { decrement: reward.pointCost } }
        })

        // Decrement stock if applicable
        if (reward.stock !== null) {
            await tx.reward.update({
                where: { id },
                data: { stock: { decrement: 1 } }
            })
        }

        return redemption
    })

    res.json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Redemption failed' })
  }
})

export default router
