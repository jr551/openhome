import { Router, type Response } from 'express'
import { prisma } from '../prisma.js'
import { authenticate, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// List Chores
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const familyId = req.user!.familyId
    const chores = await prisma.chore.findMany({
      where: { familyId },
      include: { 
        assignments: { 
          include: { 
            user: true,
            completions: true 
          } 
        } 
      }
    })
    
    const parsedChores = chores.map(chore => ({
      ...chore,
      schedule: JSON.parse(chore.schedule),
      photos: JSON.parse(chore.photos || '[]'),
      assignments: chore.assignments.map(a => ({
        ...a,
        completions: a.completions.map(c => ({
          ...c,
          beforePhotos: JSON.parse(c.beforePhotos || '[]'),
          afterPhotos: JSON.parse(c.afterPhotos || '[]'),
        }))
      }))
    }))

    res.json(parsedChores)
  } catch (error) {
    console.error('List chores error:', error)
    res.status(500).json({ error: 'Failed to fetch chores' })
  }
})

// Create Chore
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const familyId = req.user!.familyId
    const { title, description, points, schedule, difficulty, photos, assignees } = req.body

    const chore = await prisma.chore.create({
      data: {
        familyId,
        title,
        description,
        points,
        schedule: JSON.stringify(schedule),
        difficulty,
        photos: JSON.stringify(photos || []),
      }
    })

    if (assignees && Array.isArray(assignees) && assignees.length > 0) {
      await Promise.all(assignees.map((userId: string) => 
        prisma.choreAssignment.create({
          data: {
            choreId: chore.id,
            userId,
            status: 'pending'
          }
        })
      ))
    }

    res.status(201).json(chore)
  } catch (error) {
    console.error('Create chore error:', error)
    res.status(500).json({ error: 'Failed to create chore' })
  }
})

// Get Chore Details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const chore = await prisma.chore.findUnique({
      where: { id },
      include: { 
        assignments: { 
          include: { 
            user: true,
            completions: true
          } 
        } 
      }
    })

    if (!chore) {
      res.status(404).json({ error: 'Chore not found' })
      return
    }

    const parsedChore = {
      ...chore,
      schedule: JSON.parse(chore.schedule),
      photos: JSON.parse(chore.photos || '[]'),
      assignments: chore.assignments.map(a => ({
        ...a,
        completions: a.completions.map(c => ({
          ...c,
          beforePhotos: JSON.parse(c.beforePhotos || '[]'),
          afterPhotos: JSON.parse(c.afterPhotos || '[]'),
        }))
      }))
    }

    res.json(parsedChore)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chore' })
  }
})

// Submit Completion
router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { userId } = req.user!
    const { beforePhotos, afterPhotos, notes, timeSpent } = req.body

    // Find assignment
    const assignment = await prisma.choreAssignment.findFirst({
      where: { choreId: id, userId: userId }
    })

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' })
      return
    }

    const completion = await prisma.choreCompletion.create({
      data: {
        assignmentId: assignment.id,
        userId: userId!,
        beforePhotos: JSON.stringify(beforePhotos || []),
        afterPhotos: JSON.stringify(afterPhotos || []),
        notes,
        timeSpent,
        status: 'pending'
      }
    })

    // Update assignment status
    await prisma.choreAssignment.update({
      where: { id: assignment.id },
      data: { status: 'completed' }
    })

    res.status(201).json(completion)
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit completion' })
  }
})

// Approve Completion
router.post('/:id/approve', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params // This is chore ID or completion ID? Usually completion ID or pass chore ID and completion ID
    // Architecture says /api/chores/:id/approve
    // Let's assume :id is the completion ID or we find the pending completion for this chore
    // If it's chore ID, we need completion ID from body
    
    const { completionId, approved } = req.body

    if (!completionId) {
      res.status(400).json({ error: 'Completion ID required' })
      return
    }

    const completion = await prisma.choreCompletion.findUnique({
      where: { id: completionId },
      include: { assignment: { include: { chore: true, user: true } } }
    })

    if (!completion) {
      res.status(404).json({ error: 'Completion not found' })
      return
    }

    const status = approved ? 'approved' : 'rejected'
    
    // Update completion
    await prisma.choreCompletion.update({
      where: { id: completionId },
      data: { status, approvedAt: new Date() }
    })

    // Update assignment
    await prisma.choreAssignment.update({
      where: { id: completion.assignmentId },
      data: { status }
    })

    // If approved, award points
    if (approved) {
      const points = completion.assignment.chore.points
      await prisma.user.update({
        where: { id: completion.userId },
        data: {
          points: { increment: points },
          streak: { increment: 1 } // Simple streak logic
        }
      })
    }

    res.json({ success: true, status })
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve completion' })
  }
})

export default router
