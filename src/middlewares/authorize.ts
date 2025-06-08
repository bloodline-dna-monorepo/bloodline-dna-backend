import { Response, NextFunction } from 'express'
import { AuthRequest } from './authenticate'

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Kiểm tra nếu người dùng chưa được xác thực
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' })
      return
    }

    // Kiểm tra nếu vai trò của người dùng không hợp lệ
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden - insufficient rights to access this resource' })
      return
    }

    // Nếu mọi điều kiện đều hợp lệ, chuyển tiếp đến middleware tiếp theo
    next()
  }
}
