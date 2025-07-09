import { Router } from 'express'
import { managerController } from '../controllers/managerController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

// Dashboard
router.get('/dashboard', authenticate, authorize(['Manager']), managerController.getDashboardStats)

// Test Results Management
router.get('/test-results', authenticate, authorize(['Manager']), managerController.getTestResults)
router.get('/test-results/:testResultId', authenticate, authorize(['Manager']), managerController.getTestResultById)
router.put(
  '/test-results/:testResultId/approve',
  authenticate,
  authorize(['Manager']),
  managerController.approveTestResult
)
router.put(
  '/test-results/:testResultId/reject',
  authenticate,
  authorize(['Manager']),
  managerController.rejectTestResult
)

// Feedback Management
router.get('/feedbacks', authenticate, authorize(['Manager']), managerController.getFeedbacks)
router.get('/feedbacks/stats', authenticate, authorize(['Manager']), managerController.getFeedbackStats)

// Blog Management
router.get('/blogs', managerController.getBlogs)
router.get('/blogs/:blogId', authenticate, authorize(['Manager']), managerController.getBlogById)
router.post('/blogs', authenticate, authorize(['Manager']), managerController.createBlog)
router.put('/blogs/:blogId', authenticate, authorize(['Manager']), managerController.updateBlog)
router.delete('/blogs/:blogId', authenticate, authorize(['Manager']), managerController.deleteBlog)

export { router as managerRoutes }
