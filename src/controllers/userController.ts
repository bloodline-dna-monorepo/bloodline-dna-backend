import type { Request, Response, NextFunction } from 'express'
import { userService } from '../services/userService'
import { MESSAGES } from '../constants/messages'
import { createError } from '../middlewares/errorMiddleware'
import { AuthRequest } from '@/middlewares/authMiddleware'

export const userController = {
  // Get current user profile
  getProfile: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.accountId

      const profile = await userService.getUserProfile(userId)
      if (!profile) {
        throw createError(MESSAGES.ERROR.NOT_FOUND, 404, 'NOT_FOUND')
      }
      res.status(200).json({ message: MESSAGES.PROFILE.PROFILE_RETRIEVED, data: profile })
      return
    } catch (error) {
      next(error)
    }
  },

  // Update user profile
  updateProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId
      const updateData = req.body

      const updatedProfile = await userService.updateUserProfile(userId, updateData)
      res.status(200).json({ message: MESSAGES.PROFILE.UPDATE_SUCCESS, updatedProfile })
      return
    } catch (error) {
      next(error)
    }
  },

  // Upload signature
  uploadSignature: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId
      const file = req.file

      if (!file) {
        throw createError(MESSAGES.VALIDATION.REQUIRED_FIELD, 400, 'VALIDATION_ERROR')
      }

      const signaturePath = `/uploads/signatures/${file.filename}`
      await userService.updateSignature(userId, signaturePath)

      res.status(200).json({ message: MESSAGES.FILE.FILE_UPLOADED, signaturePath })
      return
    } catch (error) {
      next(error)
    }
  },

  // Get all users (Admin only)
  getAllUsers: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user
    try {
      const response = await userService.getAllUsers(user?.email)
    } catch (error) {
      next(error)
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req as any).user.role
      const { email, roleId } = req.body

      // Check if user is admin

      await userService.updateUserRole(email, roleId)

      res.status(200).json({ message: MESSAGES.SUCCESS.ACTION_PERFORMED_SUCCESS })
      return
    } catch (error) {
      next(error)
    }
  }

  // Toggle user status (Admin only)
}
