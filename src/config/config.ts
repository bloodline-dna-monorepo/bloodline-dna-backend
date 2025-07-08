import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number.parseInt(process.env.PORT || '5000'),

  database: {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'BloodTestServiceDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    port: Number.parseInt(process.env.DB_PORT || '1433'),
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'hackhocai',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'hackhocai',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },

  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE || 'NFX108ET',
    hashSecret: process.env.VNP_HASH_SECRET || 'PMKWSF6R89EHHZV4GM03ORGI4QMJJ31R',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/result',
    ipnUrl: process.env.VNP_IPN_URL || 'http://localhost:5000/api/payment/vnpay-ipn'
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || ''
  },

  upload: {
    maxFileSize: Number.parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword']
  },

  admin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@bloodlinedna.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!'
  },

  nodeEnv: process.env.NODE_ENV || 'development'
}
