import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config'

export type Role = 'admin' | 'manager' | 'staff' | 'customer'

export interface AuthUser {
  userId: string
  email: string
  role: Role
}

export interface AuthRequest extends Request {
  user?: AuthUser
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header is missing' })
    return
  }

  // Kiểm tra token có phải là dạng "Bearer <token>"
  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ message: 'Token is missing in the Authorization header' })
    return
  }

  try {
    // Giải mã token và gán vào req.user
    const payload = jwt.verify(token, jwtSecret) as AuthUser
    req.user = payload
    next() // Chuyển tiếp đến middleware tiếp theo
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
