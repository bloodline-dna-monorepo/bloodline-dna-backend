import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  jwtSecret: process.env.JWT_SECRET || 'your_default_jwt_secret',
  databaseUrl: process.env.DATABASE_URL || ''
  // Thêm các biến config khác bạn đang dùng trong .env ở đây
}
