import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { userController } from '../controllers/userController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'))
    }
  }
})

// Protected user routes
router.get('/profile', authenticate, userController.getProfile)
router.put('/profile', authenticate, userController.updateProfile)
// router.post(
//   '/upload-signature',
//   authenticate,
//   upload.single('signature'),
//   validateFileUpload({
//     required: true,
//     maxSize: 5 * 1024 * 1024, // 5MB
//     allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
//     fieldName: 'signature'
//   }),
//   userController.uploadSignature
// )

export default router
