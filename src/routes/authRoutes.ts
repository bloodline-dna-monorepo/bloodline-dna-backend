import { Router } from 'express'
import {
  loginHandler,
  logoutHandler,
  PasswordChangeHandler,
  refreshAccessTokenHandler,
  registerHandler
} from '../controllers/authController'
import { authenticate, authorize } from '../middlewares/authMiddleware'
import { userController } from '../controllers/userController'

const router = Router()

// Public routes
router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.post('/refresh-token', refreshAccessTokenHandler)
router.post('/logout', logoutHandler)

// Protected routes
router.get('/profile', authenticate, userController.getProfile)
router.put('/change-password', authenticate, PasswordChangeHandler)

export default router
