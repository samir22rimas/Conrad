import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { lessons: true } },
    },
  });
  res.json(courses);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          slug: true,
          duration: true,
          order: true,
          _count: { select: { exercises: true } },
        },
      },
    },
  });

  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  res.json(course);
}));

router.get('/:slug/lessons/:lessonSlug', asyncHandler(async (req: AuthRequest, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: req.params.lessonSlug },
    include: {
      exercises: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          difficulty: true,
          points: true,
        },
      },
      course: { select: { title: true, slug: true } },
    },
  });

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  if (lesson.course.slug !== req.params.slug) {
    return res.status(404).json({ error: 'Lesson not found in this course' });
  }

  // Get user's progress for this lesson
  // FIX: Use findFirst instead of findUnique — composite unique with null courseId
  // doesn't work reliably with Prisma's compound key finder
  const progress = await prisma.progress.findFirst({
    where: {
      userId: req.user!.id,
      lessonId: lesson.id,
    },
  });

  res.json({ ...lesson, userProgress: progress });
}));

export { router as courseRouter };
