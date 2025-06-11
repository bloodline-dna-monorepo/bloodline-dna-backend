import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authenticate'
import { PaymentService } from '../services/paymentService'

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testRequestId, amount } = req.body
    const user = req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const paymentData = {
      amount,
      orderInfo: `Thanh toan xet nghiem DNA - Don hang ${testRequestId}`,
      testRequestId,
      returnUrl: `${process.env.FRONTEND_URL}/payment/callback`
    }

    const result = await PaymentService.createVNPayPayment(paymentData)
    res.json({ success: true, paymentUrl: result.paymentUrl, transactionId: result.transactionId })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const vnpParams = req.query as Record<string, string>
    const isValid = await PaymentService.verifyVNPayPayment(vnpParams)

    if (isValid) {
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?txn=${vnpParams.vnp_TxnRef}`)
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`)
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
