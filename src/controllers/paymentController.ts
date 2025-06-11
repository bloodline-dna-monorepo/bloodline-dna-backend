import type { Request, Response } from 'express'
import crypto from 'crypto'
import { ApiService } from '../services/apiService'

interface VNPayRequest {
  amount: number
  orderInfo: string
  appointmentId: number
}

interface VNPayCallback {
  vnp_Amount: string
  vnp_BankCode: string
  vnp_CardType: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TmnCode: string
  vnp_TransactionNo: string
  vnp_TxnRef: string
  vnp_SecureHashType: string
  vnp_SecureHash: string
}

export class PaymentController {
  // Tạo URL thanh toán VNPay
  static async createPaymentUrl(req: Request, res: Response) {
    try {
      const { amount, orderInfo, appointmentId }: VNPayRequest = req.body

      const vnp_TmnCode = process.env.VNP_TMN_CODE || 'DEMO'
      const vnp_HashSecret = process.env.VNP_HASH_SECRET || 'DEMO_SECRET'
      const vnp_Url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
      const vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/callback'

      const date = new Date()
      const createDate = date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z/, '')
      const orderId = `${appointmentId}_${Date.now()}`

      const vnp_Params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnp_TmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: (amount * 100).toString(),
        vnp_ReturnUrl: vnp_ReturnUrl,
        vnp_IpAddr: req.ip || '127.0.0.1',
        vnp_CreateDate: createDate
      }

      // Sắp xếp params theo alphabet
      const sortedParams = Object.keys(vnp_Params).sort()
      let signData = ''
      let querystring = ''

      for (const key of sortedParams) {
        if (signData) {
          signData += '&'
          querystring += '&'
        }
        signData += `${key}=${vnp_Params[key]}`
        querystring += `${key}=${encodeURIComponent(vnp_Params[key])}`
      }

      const hmac = crypto.createHmac('sha512', vnp_HashSecret)
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
      querystring += `&vnp_SecureHash=${signed}`

      const paymentUrl = `${vnp_Url}?${querystring}`

      res.json({
        success: true,
        paymentUrl,
        orderId
      })
    } catch (error) {
      console.error('Payment URL creation error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi tạo URL thanh toán'
      })
    }
  }

  // Xử lý callback từ VNPay
  static async handleCallback(req: Request, res: Response) {
    try {
      const vnp_Params = req.query as unknown as VNPayCallback
      const vnp_HashSecret = process.env.VNP_HASH_SECRET || 'DEMO_SECRET'

      const secureHash = vnp_Params.vnp_SecureHash
      delete (vnp_Params as any).vnp_SecureHash
      delete (vnp_Params as any).vnp_SecureHashType

      // Sắp xếp params
      const sortedParams = Object.keys(vnp_Params).sort()
      let signData = ''

      for (const key of sortedParams) {
        if (signData) {
          signData += '&'
        }
        signData += `${key}=${vnp_Params[key as keyof VNPayCallback]}`
      }

      const hmac = crypto.createHmac('sha512', vnp_HashSecret)
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

      if (secureHash === signed) {
        if (vnp_Params.vnp_ResponseCode === '00') {
          // Thanh toán thành công
          const appointmentId = vnp_Params.vnp_TxnRef.split('_')[0]

          // Cập nhật trạng thái appointment
          await ApiService.updateAppointmentPaymentStatus(Number.parseInt(appointmentId), {
            status: 'Confirmed',
            paymentStatus: 'Paid',
            transactionId: vnp_Params.vnp_TransactionNo,
            paymentDate: new Date()
          })

          res.json({
            success: true,
            message: 'Thanh toán thành công',
            appointmentId
          })
        } else {
          res.json({
            success: false,
            message: 'Thanh toán thất bại'
          })
        }
      } else {
        res.json({
          success: false,
          message: 'Chữ ký không hợp lệ'
        })
      }
    } catch (error) {
      console.error('Payment callback error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi xử lý callback thanh toán'
      })
    }
  }
}
