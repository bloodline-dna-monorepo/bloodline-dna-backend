import express, { Router } from 'express'
import { createPaymentUrl, handleVnpayReturn } from '../controllers/paymentController'
import { authenticate } from '../middlewares/authMiddleware'

const router = Router()

router.post('/create-vnpay-url', authenticate, createPaymentUrl)
router.get('/vnpay-return', handleVnpayReturn)

export { router as paymentRoutes }
