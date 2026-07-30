import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const submitSchema = z.object({
  code: z.string().optional(),
  answer: z.string().optional(),
  timeSpent: z.number().min(0).default(0),
  hintsUsed: z.number().min(0).default(0),
});

router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      difficulty: true,
      starterCode: true,
      hints: true,
      tags: true,
      points: true,
      lesson: { select: { title: true, course: { select: { title: true } } } },
    },
  });

  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  res.json(exercise);
}));

router.post('/:id/submit', validate(submitSchema), asyncHandler(async (req: AuthRequest, res) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: req.params.id },
  });

  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  // Simple evaluation logic - in production, use a sandboxed runner
  let isCorrect = false;
  let score = 0;
  let feedback = '';

  if (exercise.type === 'MULTIPLE_CHOICE' || exercise.type === 'FILL_BLANK') {
    isCorrect = req.body.answer === exercise.solution;
    score = isCorrect ? exercise.points : 0;
    feedback = isCorrect ? 'Correct!' : 'Not quite. Try again.';
  } else if (exercise.type === 'CODING' || exercise.type === 'DEBUGGING') {
    // For coding exercises, we'd run the code in a sandbox
    // For now, do a basic check
    isCorrect = req.body.code?.includes(exercise.solution || '');
    score = isCorrect ? exercise.points : Math.floor(exercise.points * 0.3);
    feedback = isCorrect ? 'All tests passed!' : 'Some tests failed. Review your logic.';
  }

  const attempt = await prisma.exerciseAttempt.create({
    data: {
      userId: req.user!.id,
      exerciseId: req.params.id,
      code: req.body.code,
      isCorrect,
      score,
      timeSpent: req.body.timeSpent,
      hintsUsed: req.body.hintsUsed,
      feedback,
    },
  });

  // Update user XP if correct
  if (isCorrect) {
    await prisma.profile.update({
      where: { userId: req.user!.id },
      data: {
        xp: { increment: score },
        conceptsMastered: { increment: 1 },
      },
    });
  }

  res.json({ attempt, isCorrect, score, feedback });
}));

router.get('/:id/attempts', asyncHandler(async (req: AuthRequest, res) => {
  const attempts = await prisma.exerciseAttempt.findMany({
    where: {
      userId: req.user!.id,
      exerciseId: req.params.id,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(attempts);
}));

export { router as exerciseRouter };
