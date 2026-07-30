import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { category, due } = req.query;

  const where: any = {};
  if (category) where.category = category;

  let flashcards = await prisma.flashcard.findMany({
    where,
    include: {
      progress: {
        where: { userId: req.user!.id },
      },
    },
  });

  if (due === 'true') {
    const now = new Date();
    flashcards = flashcards.filter(fc => {
      const prog = fc.progress[0];
      return !prog || prog.nextReview <= now;
    });
  }

  res.json(flashcards);
}));

router.post('/:id/review', asyncHandler(async (req: AuthRequest, res) => {
  const { quality } = req.body; // 0-5 rating

  const progress = await prisma.flashcardProgress.findUnique({
    where: {
      userId_flashcardId: {
        userId: req.user!.id,
        flashcardId: req.params.id,
      },
    },
  });

  // SM-2 algorithm simplified
  let interval = 1;
  let repetitions = 0;
  let easeFactor = 2.5;

  if (progress) {
    interval = progress.interval;
    repetitions = progress.repetitions;
    easeFactor = progress.easeFactor;

    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  const updated = await prisma.flashcardProgress.upsert({
    where: {
      userId_flashcardId: {
        userId: req.user!.id,
        flashcardId: req.params.id,
      },
    },
    create: {
      userId: req.user!.id,
      flashcardId: req.params.id,
      interval,
      repetitions,
      easeFactor,
      nextReview,
      lastReviewed: new Date(),
      isMastered: repetitions >= 5,
    },
    update: {
      interval,
      repetitions,
      easeFactor,
      nextReview,
      lastReviewed: new Date(),
      isMastered: repetitions >= 5,
    },
  });

  res.json(updated);
}));

export { router as flashcardRouter };
