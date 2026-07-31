import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  github: z.string().url().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  location: z.string().max(100).optional(),
  preferredLang: z.string().optional(),
  experience: z.enum(['COMPLETE_BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  learningGoals: z.array(z.string().min(1).max(80)).max(6).optional(),
  teachingStyle: z.enum(['MORE_HINTS', 'DETAILED_EXPLANATIONS', 'INTERACTIVE_QUESTIONING', 'FAST_LEARNING']).optional(),
});

const onboardingSchema = z.object({
  experience: z.enum(['COMPLETE_BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  preferredLang: z.string().min(1).max(50),
  learningGoals: z.array(z.string().min(1).max(80)).min(1).max(6),
  teachingStyle: z.enum(['MORE_HINTS', 'DETAILED_EXPLANATIONS', 'INTERACTIVE_QUESTIONING', 'FAST_LEARNING']),
});

const updateSettingsSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
  language: z.string().optional(),
  aiGuidanceLevel: z.number().min(0).max(100).optional(),
  sessionReminders: z.boolean().optional(),
  achievementAlerts: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
});

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      profile: true,
      settings: true,
      achievements: {
        include: { achievement: true },
        orderBy: { unlockedAt: 'desc' },
      },
      _count: {
        select: {
          chats: true,
          exercises: true,
          projects: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}));

// Update profile
router.patch('/profile', validate(updateProfileSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: req.body.name,
      profile: {
        update: {
          bio: req.body.bio,
          github: req.body.github,
          linkedin: req.body.linkedin,
          website: req.body.website,
          location: req.body.location,
          preferredLang: req.body.preferredLang,
          experience: req.body.experience,
          learningGoals: req.body.learningGoals,
          teachingStyle: req.body.teachingStyle,
        },
      },
    },
    include: { profile: true },
  });

  res.json(user);
}));

// Complete the first-run learner setup.
router.post('/onboarding', validate(onboardingSchema), asyncHandler(async (req: AuthRequest, res) => {
  const profile = await prisma.profile.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, ...req.body, onboardingCompleted: true },
    update: { ...req.body, onboardingCompleted: true },
  });
  res.json(profile);
}));

// Get settings
router.get('/settings', asyncHandler(async (req: AuthRequest, res) => {
  const settings = await prisma.settings.findUnique({
    where: { userId: req.user!.id },
  });
  res.json(settings);
}));

// Update settings
router.patch('/settings', validate(updateSettingsSchema), asyncHandler(async (req: AuthRequest, res) => {
  const settings = await prisma.settings.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      ...req.body,
    },
    update: req.body,
  });
  res.json(settings);
}));

// Get dashboard stats
router.get('/stats', asyncHandler(async (req: AuthRequest, res) => {
  const [
    profile,
    totalChats,
    totalExercises,
    completedExercises,
    totalQuizzes,
    quizAvg,
    streak,
    recentSessions,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: req.user!.id } }),
    prisma.chat.count({ where: { userId: req.user!.id } }),
    prisma.exerciseAttempt.count({ where: { userId: req.user!.id } }),
    prisma.exerciseAttempt.count({ where: { userId: req.user!.id, isCorrect: true } }),
    prisma.quizAttempt.count({ where: { userId: req.user!.id } }),
    prisma.quizAttempt.aggregate({
      where: { userId: req.user!.id },
      _avg: { score: true },
    }),
    prisma.profile.findUnique({
      where: { userId: req.user!.id },
      select: { streak: true, longestStreak: true },
    }),
    prisma.session.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 7,
      select: { duration: true, type: true, createdAt: true },
    }),
  ]);

  res.json({
    xp: profile?.xp || 0,
    level: profile?.level || 1,
    streak: streak?.streak || 0,
    longestStreak: streak?.longestStreak || 0,
    totalStudyTime: profile?.totalStudyTime || 0,
    bugsSolved: profile?.bugsSolved || 0,
    conceptsMastered: profile?.conceptsMastered || 0,
    totalChats,
    totalExercises,
    completedExercises,
    exerciseAccuracy: totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0,
    totalQuizzes,
    quizAverage: quizAvg._avg.score ? Math.round(quizAvg._avg.score) : 0,
    recentSessions,
  });
}));

export { router as userRouter };
