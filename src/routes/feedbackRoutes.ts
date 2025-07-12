import { Router } from 'express'
import { feedbackController } from '../controllers/feedbackController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

router.get('/pending', authenticate, authorize(['Customer']), feedbackController.getPendingFeedback)

router.get('/submitted', authenticate, authorize(['Customer']), feedbackController.getSubmittedFeedback)
// New public route for general feedbacks
router.get('/public', feedbackController.getPublicFeedbacks)
router.post('/', authenticate, authorize(['Customer']), feedbackController.submitFeedback)

export { router as feedbackRoutes }
