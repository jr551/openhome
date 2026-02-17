/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key'

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
      JWT_SECRET,
      { expiresIn: '1h' }
    )
    
    const refreshToken = jwt.sign(
      { userId: result.user.id, familyId: result.family.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      refreshToken,
      family: result.family,
      user: result.user,
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
    } else {
        // If no userId, maybe login as the first parent or just return family info?
        // For now, let's assume we need a user to generate a valid token for actions,
        // but maybe we return a temporary token for family-level access?
        // Let's just return family info and no token if no userId, 
        // OR return a token that only allows fetching members?
        // Architecture says response has token.
        // Let's return a token with just familyId if no userId.
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' })
    const refreshToken = jwt.sign(tokenPayload, REFRESH_SECRET, { expiresIn: '7d' })

    // Remove pinHash from response
    const { pinHash, ...familyWithoutPin } = family

    res.json({
      token,
      refreshToken,
      family: familyWithoutPin,
      user,
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
        const payload = jwt.verify(refreshToken, REFRESH_SECRET) as any
        const token = jwt.sign(
            { userId: payload.userId, familyId: payload.familyId, role: payload.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        )
        res.json({ token })
    } catch (error) {
        res.status(403).json({ error: 'Invalid refresh token' })
    }
})

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    // Middleware should attach user to req
    // But since we don't have auth middleware yet, let's skip implementation or add TODO
    // For now, let's assume the client handles state.
    res.status(501).json({ error: 'Not implemented' })
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

        res.status(201).json(newUser)
    } catch (error) {
        console.error('Register member error:', error)
        res.status(500).json({ error: 'Failed to add member' })
    }
})

export default router
