import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { aiService } from '../services/ai';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const createChatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['TUTOR', 'DEBUG', 'REVIEW', 'PROJECT']).default('TUTOR'),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000), // SEC-007 FIX: Limit message size
});

// SEC-004 FIX: Input sanitization helper
const sanitizeContent = (content: string): string => {
  // Remove potentially dangerous patterns while preserving markdown
  return content
    .replace(/<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Get all chats for user
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const chats = await prisma.chat.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
  res.json(chats);
}));

// Create new chat
router.post('/', validate(createChatSchema), asyncHandler(async (req: AuthRequest, res) => {
  const chat = await prisma.chat.create({
    data: {
      userId: req.user!.id,
      title: req.body.title || 'New Chat',
      type: req.body.type,
    },
  });
  res.status(201).json(chat);
}));

// Get chat with messages
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const chat = await prisma.chat.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      },
    },
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  res.json(chat);
}));

// Send message and get AI response (streaming)
router.post('/:id/messages', validate(sendMessageSchema), asyncHandler(async (req: AuthRequest, res) => {
  const chatId = req.params.id;
  const rawContent = req.body.content;

  // SEC-004 FIX: Sanitize user input
  const content = sanitizeContent(rawContent);

  if (!content) {
    return res.status(400).json({ error: 'Invalid message content' });
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
  });

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Save user message
  await prisma.message.create({
    data: {
      chatId,
      role: 'USER',
      content,
    },
  });

  // Build message history for AI
  const history = chat.messages.map(m => ({
    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
    content: m.content,
  }));

  // Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let fullResponse = '';

  try {
    for await (const chunk of aiService.streamChat([
      ...history,
      { role: 'user', content },
    ])) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Save AI response
    await prisma.message.create({
      data: {
        chatId,
        role: 'ASSISTANT',
        content: fullResponse,
      },
    });

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('AI streaming error:', error);
    res.write(`data: ${JSON.stringify({ error: 'AI response failed' })}\n\n`);
    res.end();
  }
}));

// Delete chat
router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  await prisma.chat.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.status(204).send();
}));

export { router as chatRouter };
