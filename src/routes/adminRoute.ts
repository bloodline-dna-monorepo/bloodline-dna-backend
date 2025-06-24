import { Router } from 'express'
import { userController } from '../controllers/userController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

// All admin routes require authentication and admin role

// Get all users for role assignment
router.get('/users', authenticate, authorize(['Admin']), userController.getAllUsers)

// Update user role
router.put('/users', authenticate, authorize(['Admin']), userController.updateUserRole)

// Toggle user status
export default router
