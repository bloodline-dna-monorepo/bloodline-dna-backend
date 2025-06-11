import express from 'express'
import {
  createAppointment,
  getAppointmentPrice,
  processPayment,
  getAllServices
} from '../controllers/appointmentsController'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = express.Router()

// Customer tạo lịch hẹn
router.post('/', authenticate, authorize(['Customer']), createAppointment)

// Lấy giá dịch vụ
router.get('/price/:serviceId', getAppointmentPrice)

// Customer thanh toán
router.post('/payment', authenticate, authorize(['Customer']), processPayment)

// Get all services
router.get('/services', getAllServices)

export default router
