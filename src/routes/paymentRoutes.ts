import { Router } from 'express'
import { paymentController } from '../controllers/paymentController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

// Create payment
router.post('/create', authenticate, authorize(['Customer']), paymentController.createPayment)

// VNPay return URL
router.get('/vnpay-return', paymentController.handleVNPayReturn)

// Get payment session
router.get('/session/:sessionId', paymentController.getPaymentSession)

export default router
