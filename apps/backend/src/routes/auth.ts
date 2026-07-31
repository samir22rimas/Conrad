import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import rateLimit from 'express-rate-limit';
import { authenticate, type AuthRequest } from '../middleware/auth';

const router = Router();

// SEC-002 FIX: Strong password complexity
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});

// SEC-005 FIX: Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

const auditLog = (event: string, userId: string | null, details: any, req: any) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    ...details,
  }));
};

// Signup
router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    auditLog('SIGNUP_FAILURE', null, { reason: 'email_exists', email }, req);
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      profile: { create: {} },
      settings: { create: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  auditLog('SIGNUP_SUCCESS', user.id, { email }, req);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'], issuer: 'conrad-api', audience: 'conrad-app' }
  );

  res.status(201).json({ user, token });
}));

// Login
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !user.password) {
    auditLog('LOGIN_FAILURE', null, { reason: 'user_not_found', email }, req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    auditLog('LOGIN_FAILURE', user.id, { reason: 'invalid_password', email }, req);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  auditLog('LOGIN_SUCCESS', user.id, { email }, req);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'], issuer: 'conrad-api', audience: 'conrad-app' }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
    },
    token,
  });
}));

// Google OAuth
router.post('/google', authLimiter, asyncHandler(async (req, res) => {
  const { access_token } = req.body;

  if (!access_token || typeof access_token !== 'string') {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(access_token);

  if (error || !supabaseUser) {
    auditLog('OAUTH_FAILURE', null, { reason: 'invalid_token', provider: 'google' }, req);
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  let user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
    include: { profile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split('@')[0],
        avatar: supabaseUser.user_metadata?.avatar_url,
        emailVerified: true,
        profile: { create: {} },
        settings: { create: {} },
      },
      include: { profile: true },
    });
    auditLog('OAUTH_SIGNUP', user.id, { provider: 'google', email: user.email }, req);
  } else {
    auditLog('OAUTH_LOGIN', user.id, { provider: 'google', email: user.email }, req);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'], issuer: 'conrad-api', audience: 'conrad-app' }
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile,
    },
    token,
  });
}));

// Authenticated password changes do not depend on an external email provider.
router.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { password: true } });
  if (!user?.password || !(await bcrypt.compare(req.body.currentPassword, user.password))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: await bcrypt.hash(req.body.newPassword, 12) },
  });
  auditLog('PASSWORD_CHANGED', req.user!.id, {}, req);
  res.status(204).send();
}));

// Get current user
router.get('/me', asyncHandler(async (req: any, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'conrad-api',
      audience: 'conrad-app',
      clockTolerance: 60,
    }) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true, settings: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      profile: user.profile,
      settings: user.settings,
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    throw err;
  }
}));

export { router as authRouter };
