import type { Request, Response, NextFunction } from 'express'
import { paymentService } from '../services/paymentService'

export interface CreatePaymentUrlRequest {
  amount: number
  orderInfo: string
  serviceId?: number
}

export interface CreatePaymentUrlResponse {
  success: boolean
  paymentUrl?: string
  message: string
}

export const createPaymentUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, orderInfo, serviceId }: CreatePaymentUrlRequest = req.body

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Amount is required and must be a positive number'
      })
      return
    }

    if (!orderInfo || typeof orderInfo !== 'string' || orderInfo.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Order info is required and must be a non-empty string'
      })
      return
    }

    console.log('Creating payment URL with data:', { amount, orderInfo, serviceId })

    const paymentUrl = paymentService.createVnpayUrl(amount, orderInfo)

    const response: CreatePaymentUrlResponse = {
      success: true,
      paymentUrl: paymentUrl,
      message: 'Payment URL created successfully'
    }
    console.log(response.paymentUrl)

    res.json(response)
  } catch (error) {
    console.error('Error creating VNPAY URL:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create payment URL'
    })
  }
}

export const handleVnpayReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as Record<string, string>
    console.log('VNPAY return query:', query)

    const isValid = paymentService.verifyVnpay(query)

    if (!isValid) {
      console.log('Invalid VNPAY signature')
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/result?code=invalid`)
      return
    }

    const responseCode = query.vnp_ResponseCode || 'unknown'
    console.log('VNPAY response code:', responseCode)

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/result?code=${responseCode}`)
  } catch (error) {
    console.error('Error handling VNPAY callback:', error)
    res.status(500).json({
      success: false,
      message: 'Error processing payment callback'
    })
  }
}
