import { Router } from 'express'
import { staffController } from '../controllers/staffController'
import { authenticate } from '../middlewares/authMiddleware'
import { authorize } from '../middlewares/authMiddleware'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticate)
router.use(authorize(['Staff']))

// Dashboard routes
router.get('/dashboard/stats', staffController.getDashboardStats)

// Request management routes
router.get('/requests/unconfirmed', staffController.getUnconfirmedRequests)
router.get('/requests/confirmed', staffController.getConfirmedRequests)
router.get('/requests/:requestId', staffController.getRequestById)
router.get('/requests/:requestId/detail', staffController.getRequestFullDetail)
// Request actions
router.put('/requests/:requestId/confirm', staffController.confirmRequest)
router.put('/requests/:requestId/status', staffController.updateRequestStatus)
router.put('/requests/:requestId/confirm-sample', staffController.confirmSample)

// Test result
router.post('/requests/:requestId/result', staffController.createTestResult)

export { router as staffRoutes }
