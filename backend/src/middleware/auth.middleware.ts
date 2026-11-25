import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export type AuthRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    role: AuthRole;
  };
}

/**
 * Xác thực JWT Bearer Token thật và kiểm tra phân quyền RBAC theo vai trò.
 * Mặc định luôn yêu cầu JWT thật (trả 401 nếu chưa đăng nhập, 403 nếu sai vai trò).
 */
export function requireRole(...allowedRoles: AuthRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const allowMock = process.env.ALLOW_DEV_MOCK_AUTH === 'true';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (allowMock) return next();
      return res.status(401).json({ error: 'Yêu cầu đăng nhập (thiếu Bearer Token).' });
    }

    const token = authHeader.slice(7).trim();

    if (allowMock && token.startsWith('mock-token-')) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string; role?: AuthRole };
      if (!decoded.sub || !decoded.role) {
        return res.status(401).json({ error: 'Token không hợp lệ.' });
      }

      req.user = { sub: decoded.sub, role: decoded.role };

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          error: `Bạn không có quyền thực hiện thao tác này (yêu cầu: ${allowedRoles.join(' hoặc ')}).`,
        });
      }

      return next();
    } catch {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
  };
}

export const requireAuth = requireRole();
