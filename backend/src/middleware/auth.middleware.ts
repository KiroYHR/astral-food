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
 * Xác thực JWT Bearer Token và kiểm tra phân quyền RBAC theo vai trò.
 * - Khi gửi JWT thật: luôn xác thực chữ ký và kiểm tra đúng role (401/403).
 * - Khi ở môi trường production hoặc ENFORCE_AUTH=true: bắt buộc có JWT hợp lệ.
 * - Khi ở môi trường development và Frontend dùng mock-token (DevModeSwitcher): cho phép đi qua để demo nhanh.
 */
export function requireRole(...allowedRoles: AuthRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const isStrict = config.enforceAuth;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (isStrict) {
        return res.status(401).json({ error: 'Yêu cầu đăng nhập (thiếu Bearer Token).' });
      }
      return next();
    }

    const token = authHeader.slice(7).trim();

    // Cho phép DevModeSwitcher của Frontend ở môi trường development
    if (!isStrict && token.startsWith('mock-token-')) {
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
