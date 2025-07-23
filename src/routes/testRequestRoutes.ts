import { Router } from 'express'
import { testRequestController } from '../controllers/testRequestController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

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

router.post(
  '/:testRequestId/submit-sample',
  authenticate,
  authorize(['Customer']),
  testRequestController.submitSampleInfo
)

router.get('/:testRequestId/pdf', authenticate, authorize(['Customer']), testRequestController.exportTestResultsPDF)

router.get(
  '/:testRequestId/sample-form-pdf',
  authenticate,
  authorize(['Customer']),
  testRequestController.exportSampleFormPDF
)

router.put('/:testRequestId/confirm', authenticate, authorize(['Staff']), testRequestController.createTestConfirm)

router.put('/:testRequestId/in-progress', authenticate, authorize(['Staff']), testRequestController.markInProgress)

router.post(
  '/:testRequestId/createTestResult',
  authenticate,
  authorize(['Staff']),
  testRequestController.createTestResultbyStaff
)

router.get('/viewCreateTestResult', authenticate, authorize(['Manager']), testRequestController.viewCreateTestResult)

router.get('/:testRequestId/results', authenticate, testRequestController.getTestResults)

export { router as testRequestRoutes }
