import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { aiService } from '../services/ai';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  techStack: z.array(z.string()),
});

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(projects);
}));

router.post('/', validate(createSchema), asyncHandler(async (req: AuthRequest, res) => {
  const project = await prisma.project.create({
    data: {
      userId: req.user!.id,
      ...req.body,
      status: 'PLANNING',
    },
  });
  res.status(201).json(project);
}));

router.get('/ideas', asyncHandler(async (req, res) => {
  const { difficulty, tech, hours } = req.query;

  const response = await aiService.generateProjectIdea(
    (difficulty as string) || 'MEDIUM',
    (tech as string)?.split(',') || ['javascript', 'react'],
    parseInt(hours as string) || 20
  );

  res.json(response);
}));

router.get('/ideas/library', asyncHandler(async (_req, res) => {
  const ideas = await prisma.projectIdea.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(ideas);
}));

export { router as projectRouter };
