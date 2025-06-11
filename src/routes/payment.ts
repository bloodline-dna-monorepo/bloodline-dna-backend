import express from "express"
import { PaymentController} from "../controllers/paymentController"
import { authenticate } from "../middlewares/authenticate"
import { authorize } from "../middlewares/authorize"

const router = express.Router()

// Tạo payment URL
router.post("/create", authenticate, authorize(["Customer"]), PaymentController.createPaymentUrl)

// Xử lý callback từ VNPay
router.get("/callback", PaymentController.handleCallback)

export default router
