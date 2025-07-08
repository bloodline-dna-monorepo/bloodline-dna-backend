import { buildVnpUrl, verifyVnpReturn } from '../utils/vnpayHelper'

export interface VnpayUrlParams {
  amount: number
  orderInfo: string
}

export class PaymentService {
  createVnpayUrl(amount: number, orderInfo: string): string {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be a positive number')
    }

    if (!orderInfo || orderInfo.trim().length === 0) {
      throw new Error('Order info is required')
    }

    return buildVnpUrl({ amount, orderInfo: orderInfo.trim() })
  }

  verifyVnpay(query: Record<string, string>): boolean {
    return verifyVnpReturn(query)
  }
}

export const paymentService = new PaymentService()
