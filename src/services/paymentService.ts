import crypto from 'crypto'
import sql from 'mssql'
import { poolPromise } from '../config'
import type { PaymentData, PaymentResult } from '../types'

export class PaymentService {
  static async createVNPayPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
      const vnpTmnCode = process.env.VNP_TMN_CODE || 'your_tmn_code'
      const vnpHashSecret = process.env.VNP_HASH_SECRET || 'your_hash_secret'

      const transactionId = `TXN${Date.now()}`
      const createDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]

      const vnpParams: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpTmnCode,
        vnp_Amount: (paymentData.amount * 100).toString(),
        vnp_CreateDate: createDate,
        vnp_CurrCode: 'VND',
        vnp_IpAddr: '127.0.0.1',
        vnp_Locale: 'vn',
        vnp_OrderInfo: paymentData.orderInfo,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: paymentData.returnUrl,
        vnp_TxnRef: transactionId
      }

      const sortedParams = Object.keys(vnpParams).sort()
      const queryString = sortedParams.map((key) => `${key}=${encodeURIComponent(vnpParams[key])}`).join('&')

      const hmac = crypto.createHmac('sha512', vnpHashSecret)
      hmac.update(queryString)
      const secureHash = hmac.digest('hex')

      const paymentUrl = `${vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`

      const pool = await poolPromise
      await pool
        .request()
        .input('testRequestId', sql.Int, paymentData.testRequestId)
        .input('amount', sql.Decimal(18, 2), paymentData.amount)
        .input('paymentMethod', sql.NVarChar, 'VNPay')
        .input('paymentReference', sql.NVarChar, transactionId)
        .input('paymentStatus', sql.NVarChar, 'Pending').query(`
          INSERT INTO Payments (TestRequestID, Amount, PaymentMethod, PaymentReference, PaymentStatus, CreatedAt)
          VALUES (@testRequestId, @amount, @paymentMethod, @paymentReference, @paymentStatus, GETDATE())
        `)

      return {
        paymentUrl,
        transactionId
      }
    } catch (error) {
      console.error('Create VNPay payment error:', error)
      throw error
    }
  }

  static async verifyVNPayPayment(vnpParams: Record<string, string>): Promise<boolean> {
    try {
      const vnpHashSecret = process.env.VNP_HASH_SECRET || 'your_hash_secret'
      const secureHash = vnpParams.vnp_SecureHash
      delete vnpParams.vnp_SecureHash

      const sortedParams = Object.keys(vnpParams).sort()
      const queryString = sortedParams.map((key) => `${key}=${vnpParams[key]}`).join('&')

      const hmac = crypto.createHmac('sha512', vnpHashSecret)
      hmac.update(queryString)
      const calculatedHash = hmac.digest('hex')

      if (calculatedHash === secureHash && vnpParams.vnp_ResponseCode === '00') {
        const pool = await poolPromise
        await pool
          .request()
          .input('transactionId', sql.NVarChar, vnpParams.vnp_TxnRef)
          .input('vnpayTransactionId', sql.NVarChar, vnpParams.vnp_TransactionNo).query(`
            UPDATE Payments 
            SET PaymentStatus = 'Completed', PaidAt = GETDATE(), VNPayTransactionID = @vnpayTransactionId
            WHERE PaymentReference = @transactionId
          `)

        await pool.request().input('transactionId', sql.NVarChar, vnpParams.vnp_TxnRef).query(`
            UPDATE TestRequest 
            SET Status = 'Paid'
            WHERE TestRequestID = (
              SELECT TestRequestID FROM Payments WHERE PaymentReference = @transactionId
            )
          `)

        return true
      }

      return false
    } catch (error) {
      console.error('Verify VNPay payment error:', error)
      throw error
    }
  }
}
