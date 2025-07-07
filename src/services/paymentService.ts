import crypto from 'crypto'
import { config } from '../config/config'
import { getDbPool } from '../config/database'

interface VNPayPaymentData {
  amount: number
  orderInfo: string
  orderId: string
  returnUrl: string
  ipAddr: string
}

interface PaymentSession {
  sessionId: string
  userId: number
  serviceId: number
  collectionMethod: string
  appointmentDate?: string
  amount: number
  createdAt: Date
}

interface Service {
  ServiceID: number
  ServiceName: string
  ServiceType: string
  Description: string
  Price: number
  SampleCount: number
  CollectionMethod: string
  IsActive: boolean
  CreatedAt: Date
  UpdatedAt: Date
}

interface TestRequest {
  TestRequestID: number
  AccountID: number
  ServiceID: number
  CollectionMethod: string
  Appointment?: string
  Status: string
  CreatedAt: Date
  UpdatedAt: Date
  ServiceName: string
  ServiceType: string
  Price: number
  SampleCount: number
  Description: string
}

interface PaymentResponse {
  success: boolean
  message: string
  data: {
    paymentUrl: string
    sessionId: string
    service: Service
  }
}

interface PaymentReturnResponse {
  success: boolean
  message: string
  data: {
    testRequest?: TestRequest
    transactionId?: string
    paymentStatus: 'success' | 'failed'
    responseCode?: string
  }
}

interface PaymentSessionResponse {
  success: boolean
  data: {
    session: PaymentSession
    service: Service
  }
}

class PaymentService {
  private paymentSessions: Map<string, PaymentSession> = new Map()

  createPaymentSession(
    userId: number,
    serviceId: number,
    collectionMethod: string,
    appointmentDate?: string,
    amount?: number
  ): string {
    const sessionId = crypto.randomUUID()

    const session: PaymentSession = {
      sessionId,
      userId,
      serviceId,
      collectionMethod,
      appointmentDate,
      amount: amount || 0,
      createdAt: new Date()
    }

    this.paymentSessions.set(sessionId, session)

    // Clean up old sessions (older than 30 minutes)
    this.cleanupOldSessions()

    return sessionId
  }

  getPaymentSession(sessionId: string): PaymentSession | null {
    return this.paymentSessions.get(sessionId) || null
  }

  removePaymentSession(sessionId: string): void {
    this.paymentSessions.delete(sessionId)
  }

  private cleanupOldSessions(): void {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    for (const [sessionId, session] of this.paymentSessions.entries()) {
      if (session.createdAt < thirtyMinutesAgo) {
        this.paymentSessions.delete(sessionId)
      }
    }
  }

  createVNPayPaymentUrl(paymentData: VNPayPaymentData): string {
    const vnp_TmnCode = config.vnpay.tmnCode
    const vnp_HashSecret = config.vnpay.hashSecret
    const vnp_Url = config.vnpay.url

    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paymentData.orderId,
      vnp_OrderInfo: paymentData.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: (paymentData.amount * 100).toString(), // VNPay yêu cầu số tiền tính bằng xu
      vnp_ReturnUrl: paymentData.returnUrl,
      vnp_IpAddr: paymentData.ipAddr,
      vnp_CreateDate: this.formatDate(new Date())
    }

    // Sắp xếp các tham số
    const sortedParams = Object.keys(vnp_Params).sort()

    // Tạo chuỗi tham số
    const signData = sortedParams.map((key) => `${key}=${encodeURIComponent(vnp_Params[key])}`).join('&')

    // Tạo chuỗi băm bảo mật
    const hmac = crypto.createHmac('sha512', vnp_HashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

    // Thêm mã băm vào tham số
    vnp_Params.vnp_SecureHash = signed

    // Tạo URL cuối cùng
    const finalParams = Object.keys(vnp_Params)
      .map((key) => `${key}=${encodeURIComponent(vnp_Params[key])}`)
      .join('&')

    return `${vnp_Url}?${finalParams}`
  }

  verifyVNPayReturn(vnpParams: Record<string, string>): boolean {
    const vnp_HashSecret = config.vnpay.hashSecret
    const secureHash = vnpParams.vnp_SecureHash

    // Xóa mã băm khỏi tham số
    delete vnpParams.vnp_SecureHash
    delete vnpParams.vnp_SecureHashType

    // Sắp xếp các tham số
    const sortedParams = Object.keys(vnpParams).sort()

    // Tạo chuỗi băm dữ liệu
    const signData = sortedParams.map((key) => `${key}=${vnpParams[key]}`).join('&')

    // Tạo chuỗi băm bảo mật
    const hmac = crypto.createHmac('sha512', vnp_HashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

    return signed === secureHash
  }

  async processSuccessfulPayment(sessionId: string, vnpTransactionId: string): Promise<TestRequest> {
    const session = this.getPaymentSession(sessionId)

    if (!session) {
      throw new Error('Payment session not found')
    }

    const connection = await getDbPool()

    try {
      // Create test request
      const result = await connection
        .request()
        .input('userId', session.userId)
        .input('serviceId', session.serviceId)
        .input('collectionMethod', session.collectionMethod)
        .input('appointmentDate', session.appointmentDate || null)
        .input('status', 'Input Infor').query(`
          INSERT INTO TestRequests (
            AccountID, ServiceID, CollectionMethod,
            Appointment, Status, CreatedAt, UpdatedAt
          )
          OUTPUT INSERTED.TestRequestID
          VALUES (
            @userId, @serviceId, @collectionMethod,
            @appointmentDate, @status, GETDATE(), GETDATE()
          )
        `)

      const testRequestId = result.recordset[0].TestRequestID

      const testRequestResult = await connection.request().input('testRequestId', testRequestId).query(`
          SELECT
            tr.TestRequestID,
            tr.AccountID,
            tr.ServiceID,
            tr.CollectionMethod,
            tr.Appointment,
            tr.Status,
            tr.CreatedAt,
            s.ServiceName,
            s.ServiceType,
            s.Price,
            s.SampleCount,
            s.Description
          FROM TestRequests tr
          INNER JOIN Services s ON tr.ServiceID = s.ServiceID
          WHERE tr.TestRequestID = @testRequestId
        `)

      this.removePaymentSession(sessionId)

      return testRequestResult.recordset[0]
    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}${month}${day}${hours}${minutes}${seconds}`
  }
}

export const paymentService = new PaymentService()
