import type { Request, Response, NextFunction } from 'express'
import { paymentService } from '../services/paymentService'
import { testRequestService } from '../services/testRequestService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'

class PaymentController {
  createCheckout = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.accountId
    const { serviceId, collectionMethod, appointmentDate, appointmentTime } = req.body

    const paymentData = await paymentService.createPaymentCheckout

    res.status(200).json({
      message: MESSAGES.PAYMENT.PAYMENT_CHECKOUT_SUCCESS,
      paymentData
    })
  })

  handlePaymentNotify = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const vnpayData = req.body

    const isValidSignature = paymentService.verifyVNPaySignature(vnpayData)
    if (!isValidSignature) {
      res.status(400).json({ message: MESSAGES.PAYMENT.INVALID_PAYMENT_SIGNATURE })
      return
    }

    const paymentResult = await paymentService.updatePaymentStatus(vnpayData)

    if (paymentResult.PaymentStatus === 'Completed') {
      await testRequestService.createTestRequestFromPayment(paymentResult.PaymentID)
    }

    res.status(200).json({ message: MESSAGES.PAYMENT.PAYMENT_NOTIFY_SUCCESS })
    return
  })

  verifyPayment = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { paymentId } = req.body
    const userId = req.user?.accountId

    const payment = await paymentService.getPaymentById(paymentId, userId)

    if (!payment) {
      res.status(404).json({ message: MESSAGES.PAYMENT.PAYMENT_NOT_FOUND })
      return
    }

    res.status(200).json({ message: MESSAGES.PAYMENT.PAYMENT_VERIFY_SUCCESS })
    return
  })
}

export const paymentController = new PaymentController()
