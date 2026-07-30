import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const reviewSchema = z.object({
  code: z.string().min(1),
  language: z.string().default('javascript'),
});

const debugSchema = z.object({
  code: z.string().min(1),
  error: z.string().min(1),
  language: z.string().default('javascript'),
});

const explainSchema = z.object({
  code: z.string().min(1),
  language: z.string().default('javascript'),
});

const hintSchema = z.object({
  exercise: z.string().min(1),
  code: z.string().default(''),
  attemptCount: z.number().min(0).default(0),
});

// AI Code Review
router.post('/review', validate(reviewSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { code, language } = req.body;
  const response = await aiService.reviewCode(code, language);
  res.json(response);
}));

// AI Debug Helper
router.post('/debug', validate(debugSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { code, error, language } = req.body;
  const response = await aiService.debugCode(code, error, language);
  res.json(response);
}));

// AI Explain Code
router.post('/explain', validate(explainSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { code, language } = req.body;
  const prompt = `Explain this ${language} code step by step. What does each part do? Why is it structured this way?

\`\`\`${language}
${code}
\`\`\``;
  const response = await aiService.chat([{ role: 'user', content: prompt }]);
  res.json(response);
}));

// AI Hint Generator
router.post('/hint', validate(hintSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { exercise, code, attemptCount } = req.body;
  const response = await aiService.generateHint(exercise, code, attemptCount);
  res.json(response);
}));

export { router as playgroundRouter };
