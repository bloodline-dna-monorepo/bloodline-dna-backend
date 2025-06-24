import { Router } from 'express'
import { testRequestController } from '../controllers/testRequestController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

// Đúng thứ tự: các route tĩnh (static path) phải đứng trước route động (dynamic)

const router = Router()
router.get(
  '/testRequestCustomer',
  authenticate,
  authorize(['Customer']),
  testRequestController.getTestRequestByCustomer
)
router.get('/testRequestStaff', authenticate, authorize(['Staff']), testRequestController.getTestRequestByStaff)

router.get('/', authenticate, authorize(['Staff']), testRequestController.getAllTestRequests)

router.post('/', authenticate, authorize(['Customer']), testRequestController.createTestRequest)

router.put(
  '/:testRequestId/submit-sample',
  authenticate,
  authorize(['Customer']),
  testRequestController.submitSampleInfo
)

router.get('/:testRequestId/pdf', authenticate, testRequestController.exportTestResultsPDF)

// router.get('/:testRequestId', authenticate, testRequestController.getTestRequestById)
router.put('/:testRequestId/confirm', authenticate, authorize(['Staff']), testRequestController.createTestConfirm)
router.put('/:testRequestId/in-progress', authenticate, authorize(['Staff']), testRequestController.markInProgress)
router.post(
  '/:testRequestId/createTestResult',
  authenticate,
  authorize(['Staff']),
  testRequestController.createTestResultbyStaff
)
router.put(
  '/:testResultId/verifyTestResult',
  authenticate,
  authorize(['Manager']),
  testRequestController.verifyTestResult
)
router.get(
  '/:testRequestId/results',
  authenticate,
  authorize(['Staff', 'Manager']),
  testRequestController.getTestResults
)

export { router as testRequestRoutes }
