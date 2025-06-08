import express from 'express'
import { createAppointment, getAppointmentPrice, processPayment } from '../controllers/appointmentsController'
import { authenticate } from '../middlewares/authenticate'

const router = express.Router()

// Customer tạo lịch hẹn
router.post('/', authenticate, createAppointment) // Chỉ cần gọi trực tiếp controller

// Lấy giá dịch vụ
router.get('/price/:serviceId', authenticate, getAppointmentPrice) // Chỉ cần gọi trực tiếp controller

// Customer thanh toán
router.post('/payment', authenticate, processPayment) // Chỉ cần gọi trực tiếp controller

export default router
