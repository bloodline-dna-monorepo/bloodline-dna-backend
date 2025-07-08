import crypto from 'crypto'
import qs from 'qs'
import { config } from '../config/config'

export interface VnpayParams {
  amount: number
  orderInfo: string
}

export const buildVnpUrl = ({ amount, orderInfo }: VnpayParams): string => {
  const { vnpay } = config

  if (!vnpay.tmnCode || !vnpay.hashSecret || !vnpay.url || !vnpay.returnUrl) {
    throw new Error('VNPAY configuration is incomplete')
  }

  const date = new Date()
  const createDate = date
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14)

  const vnp_Params: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpay.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: `TXN${Date.now()}`,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'billpayment',
    vnp_Amount: Math.round(Number(amount)) * 100, // Convert to VND cents
    vnp_ReturnUrl: vnpay.returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: createDate
  }

  console.log('VNPAY params before signing:', vnp_Params)

  const sortedParams = sortObject(vnp_Params)
  const signData = qs.stringify(sortedParams, { encode: false })

  console.log('Sign data:', signData)

  const hmac = crypto.createHmac('sha512', vnpay.hashSecret)
  const secureHash = hmac.update(signData, 'utf-8').digest('hex')

  const finalUrl = `${vnpay.url}?${signData}&vnp_SecureHash=${secureHash}`

  console.log('Final VNPAY URL:', finalUrl)

  return finalUrl
}
const sortObject = (obj: Record<string, any>) => {
  const sorted: Record<string, string> = {}
  const keys = Object.keys(obj).sort()

  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+')
  }

  return sorted
}
export const verifyVnpReturn = (query: Record<string, string>): boolean => {
  try {
    const { vnpay } = config

    if (!vnpay.hashSecret) {
      console.error('VNPAY hash secret not configured')
      return false
    }

    const secureHash = query.vnp_SecureHash
    if (!secureHash) {
      console.error('No secure hash in query')
      return false
    }

    // Create a copy and remove hash fields
    const queryParams = { ...query }
    delete queryParams.vnp_SecureHash
    delete queryParams.vnp_SecureHashType

    const sortedParams = sortObject(queryParams)
    const signData = qs.stringify(sortedParams, { encode: false })

    console.log('Verify sign data:', signData)

    const hash = crypto.createHmac('sha512', vnpay.hashSecret).update(signData, 'utf-8').digest('hex')

    const isValid = hash === secureHash
    console.log('Signature verification result:', isValid)

    return isValid
  } catch (error) {
    console.error('Error verifying VNPAY signature:', error)
    return false
  }
}
