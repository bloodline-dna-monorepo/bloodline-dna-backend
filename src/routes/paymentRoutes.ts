import { Router } from 'express'
import { paymentController } from '../controllers/paymentController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

// Customer payment routes
router.post(
  '/checkout',
  authenticate,
  authorize(['Customer']),

  paymentController.createCheckout
)

router.post('/verify', authenticate, paymentController.verifyPayment)

export { router as paymentRoutes }
