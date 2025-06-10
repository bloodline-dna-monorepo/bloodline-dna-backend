import express, { type Request, type Response, type NextFunction } from "express"
import appointmentsRoutes from "./routes/appointments"
import staffRoutes from "./routes/staff"
import managerRoutes from "./routes/manager"
import customerRoutes from "./routes/customer"
import authRoutes from "./routes/auth"
import cors from "cors" // Để xử lý CORS
import helmet from "helmet" // Middleware bảo mật
import corsOptions from "./config/cors"

const app = express()

// Middleware bảo mật và CORS
app.use(helmet()) // Thêm bảo mật cho HTTP headers
app.use(cors(corsOptions)) // Giúp cho ứng dụng có thể giao tiếp với các domain khác

app.use(express.json()) // Middleware xử lý JSON body

// Routes
app.use("/auth", authRoutes)
app.use("/appointments", appointmentsRoutes)
app.use("/staff", staffRoutes)
app.use("/manager", managerRoutes)
app.use("/customer", customerRoutes)

// Middleware xử lý lỗi 404 (Không tìm thấy route)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: "Not Found" })
})

// Middleware xử lý lỗi toàn cục
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err) // Log lỗi
  res.status(500).json({ message: "Internal Server Error" })
})

export default app
