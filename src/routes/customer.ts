import express from 'express'
import { generateSampleFormPDF } from '../controllers/sampleFormController'

const router = express.Router()

// Customer tải xuống PDF mẫu đơn và kết quả
router.get('/sample-form/pdf/:appointmentId', generateSampleFormPDF)

export default router
