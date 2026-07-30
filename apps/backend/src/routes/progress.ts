import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const updateSchema = z.object({
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'MASTERED']).optional(),
  mastery: z.number().min(0).max(100).optional(),
  timeSpent: z.number().min(0).optional(),
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const progress = await prisma.progress.findMany({
    where: { userId: req.user!.id },
    include: {
      course: { select: { title: true, slug: true, category: true } },
      lesson: { select: { title: true, slug: true } },
    },
    orderBy: { lastAccessed: 'desc' },
  });
  res.json(progress);
}));

router.post('/', validate(updateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { courseId, lessonId, status, mastery, timeSpent } = req.body;

  const progress = await prisma.progress.upsert({
    where: {
      userId_courseId_lessonId: {
        userId: req.user!.id,
        lessonId: lessonId || null,
        courseId: courseId || null,
      },
    },
    create: {
      userId: req.user!.id,
      courseId: courseId || null,
      lessonId: lessonId || null,
      status: status || 'IN_PROGRESS',
      mastery: mastery || 0,
      timeSpent: timeSpent || 0,
    },
    update: {
      status: status || undefined,
      mastery: mastery !== undefined ? mastery : undefined,
      timeSpent: timeSpent ? { increment: timeSpent } : undefined,
      lastAccessed: new Date(),
      completedAt: status === 'COMPLETED' || status === 'MASTERED' ? new Date() : undefined,
    },
  });

  res.json(progress);
}));

export { router as progressRouter };
