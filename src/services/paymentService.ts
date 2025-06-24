import { getDbPool } from '../config/database'
import { serviceService } from './serviceService'
import crypto from 'crypto'
import { config } from '../config/config'

interface PaymentCheckoutData {
  userId: number
  serviceId: number
  collectionMethod: string
  appointmentDate?: string
  appointmentTime?: string
}

class PaymentService {
  async createPaymentCheckout(data: PaymentCheckoutData) {
    const connection = await getDbPool()

    // Get service details
    const service = await serviceService.getServiceById(data.serviceId)
    if (!service) {
      throw new Error('Service not found')
    }

    // Validate collection method based on service type
    if (service.serviceType === 'Administrative' && data.collectionMethod !== 'Facility') {
      throw new Error('Administrative services only support facility collection')
    }

    // Create payment record
    const result = await connection
      .request()
      .input('registrationId', null) // Will be set later when test request is created
      .input('amount', service.price)
      .input('paymentMethod', 'VNPay')
      .input('paymentStatus', 'Pending')
      .input('serviceId', data.serviceId)
      .input('userId', data.userId)
      .input('collectionMethod', data.collectionMethod)
      .input('appointmentDate', data.appointmentDate || null)
      .input('appointmentTime', data.appointmentTime || null).query(`
        INSERT INTO Payments (
          RegistrationID, Amount, PaymentMethod, PaymentStatus, 
          TransactionID, PaymentDate, CreatedAt, UpdatedAt,
          ServiceID, UserID, CollectionMethod, AppointmentDate, AppointmentTime
        )
        OUTPUT INSERTED.PaymentID
        VALUES (
          @registrationId, @amount, @paymentMethod, @paymentStatus,
          NULL, NULL, GETDATE(), GETDATE(),
          @serviceId, @userId, @collectionMethod, @appointmentDate, @appointmentTime
        )
      `)

    const paymentId = result.recordset[0].PaymentID

    // Generate VNPay URL
    const vnpayUrl = this.generateVNPayUrl(paymentId, service.price, service.serviceName)

    return {
      paymentId,
      paymentUrl: vnpayUrl,
      amount: service.price,
      serviceName: service.serviceName
    }
  }

  private generateVNPayUrl(paymentId: number, amount: number, orderInfo: string): string {
    const date = new Date()
    const createDate = date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z/, '')

    let vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.vnpay.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentId.toString(),
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: (amount * 100).toString(),
      vnp_ReturnUrl: config.vnpay.returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate
    }

    vnp_Params = this.sortObject(vnp_Params)

    const queryString = Object.keys(vnp_Params)
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&')

    const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret)
    const signed = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex')
    vnp_Params['vnp_SecureHash'] = signed

    const finalQuery = Object.keys(vnp_Params)
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&')

    return config.vnpay.url + '?' + finalQuery
  }

  verifyVNPaySignature(vnpayData: any): boolean {
    const secureHash = vnpayData.vnp_SecureHash
    delete vnpayData.vnp_SecureHash
    delete vnpayData.vnp_SecureHashType

    const sortedParams = this.sortObject(vnpayData)
    const queryString = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&')

    const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret)
    const checkSum = hmac.update(Buffer.from(queryString, 'utf-8')).digest('hex')

    return secureHash === checkSum
  }

  async updatePaymentStatus(vnpayData: any) {
    const connection = await getDbPool()

    const paymentId = Number.parseInt(vnpayData.vnp_TxnRef)
    const responseCode = vnpayData.vnp_ResponseCode
    const transactionNo = vnpayData.vnp_TransactionNo

    const status = responseCode === '00' ? 'Completed' : 'Failed'

    const result = await connection
      .request()
      .input('paymentId', paymentId)
      .input('status', status)
      .input('transactionId', transactionNo).query(`
        UPDATE Payments 
        SET PaymentStatus = @status, 
            TransactionID = @transactionId,
            PaymentDate = GETDATE(),
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE PaymentID = @paymentId
      `)

    return result.recordset[0]
  }

  async getPaymentById(paymentId: number, userId?: number) {
    const connection = await getDbPool()

    let query = `
      SELECT 
        p.PaymentID,
        p.Amount,
        p.PaymentStatus,
        p.PaymentMethod,
        p.TransactionID,
        p.PaymentDate,
        p.CollectionMethod,
        p.AppointmentDate,
        p.AppointmentTime,
        s.ServiceName,
        s.ServiceType
      FROM Payments p
      INNER JOIN Services s ON p.ServiceID = s.ServiceID
      WHERE p.PaymentID = @paymentId
    `

    const request = connection.request().input('paymentId', paymentId)

    if (userId) {
      query += ' AND p.UserID = @userId'
      request.input('userId', userId)
    }

    const result = await request.query(query)
    return result.recordset[0]
  }

  private sortObject(obj: any) {
    const sorted: any = {}
    const keys = Object.keys(obj).sort()
    keys.forEach((key) => {
      sorted[key] = obj[key]
    })
    return sorted
  }
}

export const paymentService = new PaymentService()
