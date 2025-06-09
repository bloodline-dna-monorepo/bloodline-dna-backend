import express from 'express'
import { createAppointment, getAppointmentPrice, processPayment } from '../controllers/appointmentsController'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '~/middlewares/authorize'

const router = express.Router()

// Customer tạo lịch hẹn
router.post('/', authenticate, authenticate, authorize(['customer']), createAppointment) // Chỉ cần gọi trực tiếp controller

// Lấy giá dịch vụ
router.get('/price/:serviceId', authenticate, authorize(['customer']), getAppointmentPrice) // Chỉ cần gọi trực tiếp controller

// Customer thanh toán
router.post('/payment', authenticate, authorize(['customer']), processPayment) // Chỉ cần gọi trực tiếp controller

export default router
