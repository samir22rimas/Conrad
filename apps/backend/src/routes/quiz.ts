import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const submitSchema = z.object({
  answers: z.record(z.string()),
  timeSpent: z.number().min(0).default(0),
});

router.get('/', asyncHandler(async (_req, res) => {
  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      timeLimit: true,
      _count: { select: { questions: true } },
    },
  });
  res.json(quizzes);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          question: true,
          type: true,
          options: true,
          points: true,
          order: true,
        },
      },
    },
  });

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  res.json(quiz);
}));

router.post('/:id/submit', validate(submitSchema), asyncHandler(async (req: AuthRequest, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: { questions: true },
  });

  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  let score = 0;
  const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const answers = req.body.answers;

  for (const question of quiz.questions) {
    if (answers[question.id] === question.correctAnswer) {
      score += question.points;
    }
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: req.user!.id,
      quizId: req.params.id,
      score,
      maxScore,
      timeSpent: req.body.timeSpent,
      answers,
      completedAt: new Date(),
    },
  });

  // Update XP
  await prisma.profile.update({
    where: { userId: req.user!.id },
    data: { xp: { increment: score } },
  });

  res.json({ attempt, score, maxScore, percentage: Math.round((score / maxScore) * 100) });
}));

export { router as quizRouter };
