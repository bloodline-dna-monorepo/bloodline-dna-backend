import type { Request, Response, NextFunction } from 'express'
import { paymentService } from '../services/paymentService'
import { asyncHandler } from '../middlewares/errorMiddleware'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { serviceService } from '../services/serviceService'

class PaymentController {
  // Create payment session and return payment URL
  createPayment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.accountId
    const { serviceId, collectionMethod, appointmentDate } = req.body

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' })
      return
    }

    try {
      // Get service details to calculate amount
      const service = await serviceService.getServiceById(serviceId)
      if (!service) {
        res.status(404).json({ success: false, message: 'Service not found' })
        return
      }

      // Create payment session
      const sessionId = paymentService.createPaymentSession(
        userId,
        serviceId,
        collectionMethod,
        appointmentDate,
        service.price
      )

      // Create VNPay payment URL
      const paymentUrl = paymentService.createVNPayPaymentUrl({
        amount: service.price,
        orderInfo: `Thanh toan dich vu ${service.serviceName}`,
        orderId: sessionId,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/return`,
        ipAddr: req.ip || '127.0.0.1'
      })

      res.status(200).json({
        success: true,
        message: 'Payment URL created successfully',
        data: {
          paymentUrl,
          sessionId,
          service: {
            ServiceID: service.id,
            ServiceName: service.serviceName,
            ServiceType: service.serviceType,
            Price: service.price,
            SampleCount: service.sampleCount
          }
        }
      })
    } catch (error) {
      console.error('Create payment error:', error)
      res.status(500).json({ success: false, message: 'Failed to create payment' })
    }
  })

  // Handle VNPay return
  handleVNPayReturn = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const vnpParams = req.query as Record<string, string>

    try {
      // Verify VNPay signature
      const isValid = paymentService.verifyVNPayReturn({ ...vnpParams })

      if (!isValid) {
        res.status(400).json({ success: false, message: 'Invalid payment signature' })
        return
      }

      const responseCode = vnpParams.vnp_ResponseCode
      const sessionId = vnpParams.vnp_TxnRef
      const transactionId = vnpParams.vnp_TransactionNo

      if (responseCode === '00') {
        // Payment successful
        const testRequest = await paymentService.processSuccessfulPayment(sessionId, transactionId)

        res.status(200).json({
          success: true,
          message: 'Payment successful',
          data: {
            testRequest,
            transactionId,
            paymentStatus: 'success'
          }
        })
      } else {
        // Payment failed
        res.status(400).json({
          success: false,
          message: 'Payment failed',
          data: {
            responseCode,
            paymentStatus: 'failed'
          }
        })
      }
    } catch (error) {
      console.error('VNPay return error:', error)
      res.status(500).json({ success: false, message: 'Payment processing error' })
    }
  })

  // Get payment session details
  getPaymentSession = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sessionId } = req.params

    try {
      const session = paymentService.getPaymentSession(sessionId)

      if (!session) {
        res.status(404).json({ success: false, message: 'Payment session not found' })
        return
      }

      // Get service details
      const service = await serviceService.getServiceById(session.serviceId)

      res.status(200).json({
        success: true,
        data: {
          session,
          service
        }
      })
    } catch (error) {
      console.error('Get payment session error:', error)
      res.status(500).json({ success: false, message: 'Failed to get payment session' })
    }
  })
}

export const paymentController = new PaymentController()
