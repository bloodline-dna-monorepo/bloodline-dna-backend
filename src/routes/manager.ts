import express, { Request, Response } from 'express'
import { verifyTestResult } from '../controllers/managerController'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = express.Router()

// Manager xác nhận kết quả xét nghiệm
router.put('/test-results/verify', authenticate, authorize(['manager']), verifyTestResult)
export default router
