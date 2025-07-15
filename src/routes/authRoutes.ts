import { Router } from 'express'
import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  PasswordChangeHandler,
  refreshAccessTokenHandler,
  registerHandler,
  resetPasswordHandler
} from '../controllers/authController'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { userController } from '../controllers/userController'

const router = Router()

// Public routes
router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.post('/refresh-token', refreshAccessTokenHandler)
router.delete('/logout', authenticate, logoutHandler)
//  Forgot Password routes
router.post('/forgot-password', forgotPasswordHandler)
router.post('/reset-password', resetPasswordHandler)
// Protected routes
router.get('/profile', authenticate, userController.getProfile)
router.put('/change-password', authenticate, PasswordChangeHandler)
router.put('/profile', authenticate, userController.updateProfile)

export default router
