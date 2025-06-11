import express from "express"
import cors from "cors"
import  corsOptions  from "./config/cors"
import { errorHandler } from "./middlewares/errorHandler"

// Import routes
import authRoutes from "./routes/auth"
import appointmentsRoutes from "./routes/appointments"
import customerRoutes from "./routes/customer"
import managerRoutes from "./routes/manager"
import staffRoutes from "./routes/staff"
import paymentRoutes from "./routes/payment"
import staffDashboardRoutes from "./routes/staffDashboard"
import helmet from "helmet"
import morgan from "morgan"
import logger from "./utils/logger"

const app = express()
// Logging middleware
app.use(
  morgan("dev", {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }),
)

// Security middleware
app.use(helmet())
// Middleware
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/appointments", appointmentsRoutes)
app.use("/api/customer", customerRoutes)
app.use("/api/manager", managerRoutes)
app.use("/api/staff", staffRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/staff-dashboard", staffDashboardRoutes)

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" })
})

// Error handling middleware
app.use(errorHandler)

export default app
