import express from 'express'
import { getAppointmentsForStaff, updateSampleStatus, enterTestResult } from '../controllers/staffController'

const router = express.Router()

// Staff xem danh sách các lịch hẹn
router.get('/appointments', getAppointmentsForStaff)

// Staff cập nhật trạng thái mẫu
router.put('/kits/sample-status', updateSampleStatus)

// Staff nhập kết quả xét nghiệm
router.post('/test-results', enterTestResult)

export default router
