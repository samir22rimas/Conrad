import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { userRouter } from './routes/user';
import { courseRouter } from './routes/course';
import { exerciseRouter } from './routes/exercise';
import { quizRouter } from './routes/quiz';
import { flashcardRouter } from './routes/flashcard';
import { projectRouter } from './routes/project';
import { progressRouter } from './routes/progress';
import { notificationRouter } from './routes/notification';
import { playgroundRouter } from './routes/playground';
import { errorHandler } from './middleware/error';
import { authenticate } from './middleware/auth';

dotenv.config();

// SEC-003 FIX: Validate JWT_SECRET at startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters. Generate with: openssl rand -base64 64');
}

export const app = express();
const PORT = process.env.PORT || 4000;

// SEC-008 FIX: Enhanced Helmet with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL || '', 'https://api.groq.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// SEC-006 FIX: Strict CORS origin validation
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['https://conrad.vercel.app'])
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development log the rejected origin to help debugging
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[CORS] Blocked origin: ${origin}`);
      }
      callback(null, false);
    }
  },
  credentials: true,
}));

// Global rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  // Keep the legacy header during the hackathon deployment because clients and
  // monitoring checks still consume it; standard RateLimit headers remain on.
  legacyHeaders: true,
});
app.use(limiter);

// Body parsing with limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Protected routes (require valid JWT)
app.use('/api/chat', authenticate, chatRouter);
app.use('/api/user', authenticate, userRouter);
app.use('/api/courses', authenticate, courseRouter);
app.use('/api/exercises', authenticate, exerciseRouter);
app.use('/api/quizzes', authenticate, quizRouter);
app.use('/api/flashcards', authenticate, flashcardRouter);
app.use('/api/projects', authenticate, projectRouter);
app.use('/api/progress', authenticate, progressRouter);
app.use('/api/notifications', authenticate, notificationRouter);
app.use('/api/playground', authenticate, playgroundRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export const startServer = () => app.listen(PORT, () => {
  console.log(`Conrad API running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Keep importing the Express app side-effect free. This lets tests use
// Supertest without opening a network port and prevents duplicate listeners.
if (require.main === module) {
  startServer();
}

export default app;
