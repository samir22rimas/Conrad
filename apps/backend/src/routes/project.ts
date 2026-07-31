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

const updateSchema = createSchema.partial().extend({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  features: z.array(z.string().max(200)).max(30).optional(),
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

router.patch('/:id', validate(updateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const updated = await prisma.project.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body,
  });
  if (!updated.count) return res.status(404).json({ error: 'Project not found' });
  const project = await prisma.project.findUnique({ where: { id: req.params.id } });
  res.json(project);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const deleted = await prisma.project.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  if (!deleted.count) return res.status(404).json({ error: 'Project not found' });
  res.status(204).send();
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
