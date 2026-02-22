/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import { config } from '../config.js'
import { parseJsonFields, JSON_FIELDS } from '../utils/json.js'

const router = Router()

/**
 * Register Family
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { familyName, pin, parentName } = req.body

    if (!familyName || !pin || !parentName) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    // Generate unique family code (simple implementation)
    const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10)

    // Create Family and Parent User in transaction
    const result = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          name: familyName,
          familyCode,
          pinHash,
        },
      })

      const user = await tx.user.create({
        data: {
          familyId: family.id,
          name: parentName,
          role: 'parent',
          avatar: '👨‍👩‍👧‍👦',
        },
      })

      return { family, user }
    })

    // Generate Token
    const token = jwt.sign(
      { userId: result.user.id, familyId: result.family.id, role: result.user.role },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    )
    
    const refreshToken = jwt.sign(
      { userId: result.user.id, familyId: result.family.id },
      config.REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    // Remove pinHash from response
    const { pinHash: _, ...familyWithoutPin } = result.family

    // Parse JSON fields
    const parsedUser = parseJsonFields(result.user, JSON_FIELDS)

    res.status(201).json({
      token,
      refreshToken,
      family: familyWithoutPin,
      user: parsedUser,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

/**
 * Family Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { familyCode, pin, userId } = req.body

    if (!familyCode || !pin) {
      res.status(400).json({ error: 'Missing family code or PIN' })
      return
    }

    // Find Family
    const family = await prisma.family.findUnique({
      where: { familyCode },
      include: { members: true },
    })

    if (!family) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, family.pinHash)
    if (!isPinValid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    let user = null
    let tokenPayload: any = { familyId: family.id }

    if (userId) {
      // Find User
      user = await prisma.user.findFirst({
        where: { id: userId, familyId: family.id },
      })

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }
      
      tokenPayload = { ...tokenPayload, userId: user.id, role: user.role }
    }

    let token = undefined
    let refreshToken = undefined

    if (userId) {
      token = jwt.sign(tokenPayload, config.JWT_SECRET, { expiresIn: '1h' })
      refreshToken = jwt.sign(tokenPayload, config.REFRESH_SECRET, { expiresIn: '7d' })
    }

    // Remove pinHash from response
    const { pinHash: _, ...familyWithoutPin } = family

    // Parse JSON fields
    const parsedUser = user ? parseJsonFields(user, JSON_FIELDS) : null

    res.json({
      token,
      refreshToken,
      family: familyWithoutPin,
      user: parsedUser,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

/**
 * Refresh Token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' })
        return
    }

    try {
        const payload = jwt.verify(refreshToken, config.REFRESH_SECRET) as any
        const token = jwt.sign(
            { userId: payload.userId, familyId: payload.familyId, role: payload.role },
            config.JWT_SECRET,
            { expiresIn: '1h' }
        )
        res.json({ token })
    } catch (_error) {
        res.status(403).json({ error: 'Invalid refresh token' })
    }
})

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId, familyId } = req.user!

        if (!userId) {
            // If it's a family-only token, we return the family info
            const family = await prisma.family.findUnique({
                where: { id: familyId },
                include: { members: true }
            })
            if (!family) {
                res.status(404).json({ error: 'Family not found' })
                return
            }
            const { pinHash: _, ...familyWithoutPin } = family
            res.json({ family: familyWithoutPin })
            return
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { family: true }
        })

        if (!user) {
            res.status(404).json({ error: 'User not found' })
            return
        }

        const { pinHash: _, ...familyWithoutPin } = user.family
        const parsedUser = parseJsonFields(user, JSON_FIELDS)

        res.json({ user: parsedUser, family: familyWithoutPin })
    } catch (error) {
        console.error('Get me error:', error)
        res.status(500).json({ error: 'Failed to fetch user' })
    }
})

/**
 * Register Member
 * POST /api/auth/register-member
 */
router.post('/register-member', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, role, avatar } = req.body
        const familyId = req.user!.familyId
        const requesterRole = req.user!.role

        if (requesterRole !== 'parent') {
            res.status(403).json({ error: 'Only parents can add members' })
            return
        }

        if (!name || !role) {
            res.status(400).json({ error: 'Name and role are required' })
            return
        }

        const newUser = await prisma.user.create({
            data: {
                familyId,
                name,
                role, 
                avatar: avatar || '👤'
            }
        })

        const parsedUser = parseJsonFields(newUser, JSON_FIELDS)

        res.status(201).json(parsedUser)
    } catch (error) {
        console.error('Register member error:', error)
        res.status(500).json({ error: 'Failed to add member' })
    }
})

export default router
