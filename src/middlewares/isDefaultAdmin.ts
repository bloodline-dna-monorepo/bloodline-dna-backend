import { Response, NextFunction } from 'express'
import { AuthRequest } from './authenticate'
import { DEFAULT_ADMIN_EMAIL } from '../config'

export const isDefaultAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Kiểm tra nếu người dùng chưa xác thực
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized - Missing authentication' })
    return
  }

  // Kiểm tra nếu người dùng không phải là admin mặc định
  if (req.user.role !== 'Admin' || req.user.email !== DEFAULT_ADMIN_EMAIL) {
    res.status(403).json({
      message: 'Forbidden - Only the default admin can perform this action'
    })
    return
  }

  // Nếu người dùng đúng là admin mặc định, cho phép tiếp tục
  next()
}
