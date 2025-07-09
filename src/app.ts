import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { config } from './config/config'
import { connectToDatabase, createDefaultAdmin } from './config/database'
import { errorMiddleware } from './middlewares/errorMiddleware'

// Import routes
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'

import morgan from 'morgan'
import { serviceRoutes } from './routes/serviceRoutes'
import { testRequestRoutes } from './routes/testRequestRoutes'
import { paymentRoutes } from './routes/paymentRoutes'
import { managerRoutes } from './routes/managerRoutes'
import { adminRoutes } from './routes/adminRoutes'

const app = express()

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/signatures', 'uploads/documents']
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'))
}

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
// app.use("/api/services", serviceRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/test-requests', testRequestRoutes)
app.use('/api/manager', managerRoutes)
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  })
})

// Global error handler (must be last)
app.use(errorMiddleware)

// Initialize application
export const initializeApp = async (): Promise<void> => {
  try {
    // Connect to database
    await connectToDatabase()
    console.log('✅ Database connected successfully')

    // Create default admin account
    await createDefaultAdmin()
    console.log('✅ Default admin account verified')

    console.log('✅ Application initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    throw error
  }
}

export default app
