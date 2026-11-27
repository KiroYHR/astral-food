import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { config } from '../config/index.js';
import { serializeUser } from '../utils/serializer.js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import {
  requestSesEmailVerification,
  getSesEmailVerificationStatus,
  sendWelcomeVerifiedEmail,
} from '../services/sesService.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, full_name, phone, role } = req.body;
    const actualName = (fullName || full_name || '').trim();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password || !actualName) {
      return res.status(400).json({ error: 'Email, mật khẩu và họ tên là bắt buộc.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email này đã được sử dụng.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Chỉ cho phép tự đăng ký CUSTOMER hoặc MERCHANT (không cho tự tạo ADMIN)
    const userRole = role === 'MERCHANT' ? 'MERCHANT' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: actualName,
        phone: (phone || '').trim() || null,
        role: userRole,
      },
    });

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    const emailVerification = await requestSesEmailVerification(user.email);

    return res.status(201).json({
      accessToken,
      access_token: accessToken,
      tokenType: 'Bearer',
      token_type: 'Bearer',
      user: serializeUser(user),
      emailVerification,
      email_verification: emailVerification,
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng ký.' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return res.json({
      accessToken,
      access_token: accessToken,
      tokenType: 'Bearer',
      token_type: 'Bearer',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]', error);
    return res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng nhập.' });
  }
});

// Lấy thông tin user đang đăng nhập (GET /api/v1/users/me & /api/v1/auth/me)
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa đăng nhập hoặc thiếu token xác thực.' });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string };
    if (!decoded.sub) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }

    return res.json(serializeUser(user));
  } catch {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
});

// Kiểm tra trạng thái xác thực email AWS SES của người dùng hiện tại
authRouter.get('/email-verification-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }

    const notifyWelcome =
      req.query.notifyWelcome === 'true' || req.query.notify_welcome === 'true';
    const result = await getSesEmailVerificationStatus(user.email);

    if (notifyWelcome && result.verified) {
      const welcomeSent = await sendWelcomeVerifiedEmail(user.email, user.fullName);
      return res.json({
        ...result,
        welcomeEmailSent: welcomeSent,
        welcome_email_sent: welcomeSent,
      });
    }

    return res.json({
      ...result,
      welcomeEmailSent: false,
      welcome_email_sent: false,
    });
  } catch (error) {
    console.error('[AUTH EMAIL STATUS ERROR]', error);
    return res.status(500).json({ error: 'Không thể kiểm tra trạng thái xác thực email.' });
  }
});

// Gửi lại email xác thực AWS SES cho người dùng hiện tại
authRouter.post('/resend-verification', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
    }

    const result = await requestSesEmailVerification(user.email);
    return res.json(result);
  } catch (error) {
    console.error('[AUTH RESEND VERIFICATION ERROR]', error);
    return res.status(500).json({ error: 'Không thể gửi lại email xác thực.' });
  }
});
