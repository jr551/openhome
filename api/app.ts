/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import choreRoutes from './routes/chores.js'
import allowanceRoutes from './routes/allowance.js'
import rewardsRoutes from './routes/rewards.js'
import chatRoutes from './routes/chat.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
}

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/chores', choreRoutes)
app.use('/api/allowance', allowanceRoutes)
app.use('/api/rewards', rewardsRoutes)
app.use('/api/chat', chatRoutes)

// Issue #6: Deployment: Realtime chat likely broken on Vercel/serverless
// Question: Since Vercel functions are stateless and have short timeouts,
// should we migrate to a serverless-friendly realtime solution like Pusher, Ably, or Upstash?
// Currently, Socket.io will only work on a persistent Node.js environment.

/**
 * health
 */
app.use(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

// Handle client routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
    } else {
      res.sendFile(path.join(__dirname, '../dist/index.html'))
    }
  })
}

/**
 * error handler middleware
 */
app.use((_error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
