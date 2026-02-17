import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Issue #2: Security: JWT/refresh secrets have insecure defaults
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-dev-secret'

export interface AuthRequest extends Request {
  user?: {
    userId?: string
    familyId: string
    role?: string
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' })
    return
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Token required' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    req.user = payload
    next()
  } catch (_error) {
    res.status(403).json({ error: 'Invalid token' })
  }
}
