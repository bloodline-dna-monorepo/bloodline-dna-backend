import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { DEFAULT_ADMIN_EMAIL } from '../config';

export const isDefaultAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'admin' || req.user.email !== DEFAULT_ADMIN_EMAIL) {
    res.status(403).json({ message: 'Chỉ admin mặc định mới được phép thực hiện hành động này' });
    return;
  }
  next();
};
