import express from 'express'
import {
  getAppointmentsForStaff,
  updateSampleStatus,
  enterTestResult,
  createTestConfirm,
  createTestResult
} from '../controllers/staffController'
import { authenticate } from '~/middlewares/authenticate'
import { authorize } from '~/middlewares/authorize'

const router = express.Router()

// Staff xem danh sách các lịch hẹn
router.get('/appointments', authenticate, authorize(['Staff', 'Manager', 'Admin']), getAppointmentsForStaff)

router.post('/create-testprocess/:TestRequestId', authenticate, authorize(['Staff']), createTestConfirm)
// Staff cập nhật trạng thái mẫu
router.put('/kits/sample-status', authenticate, authorize(['Staff']), updateSampleStatus)

router.post('/Create-testprocess/:TestRequestId',authenticate,authorize(['Staff']),createTestResult)
// Staff nhập kết quả xét nghiệm
router.post('/test-results', authenticate, authorize(['Staff']), enterTestResult)

// router.post('/test-process/:appoinmentsid', authenticate, authorize(['Staff']), createtestprocess)
export default router
