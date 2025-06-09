import express from 'express'
import { generateSampleFormPDF } from '../controllers/sampleFormController'
import { authenticate } from '~/middlewares/authenticate'
import { authorize } from '~/middlewares/authorize'

const router = express.Router()

// Customer tải xuống PDF mẫu đơn và kết quả
router.get('/sample-form/pdf/:appointmentId', authenticate, authorize(['customer']), generateSampleFormPDF)

export default router
