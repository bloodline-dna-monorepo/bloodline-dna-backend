import type { Response, NextFunction } from 'express'
import type { AuthRequest } from './authenticate'

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized: No user found in request' })
      return
    }

    // Convert role to lowercase for case-insensitive comparison
    const userRole = user.role.toLowerCase()
    const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase())

    if (!normalizedAllowedRoles.includes(userRole)) {
      res.status(403).json({
        message: `Forbidden: User role '${user.role}' is not allowed to access this resource`
      })
      return
    }

    next()
  }
}
