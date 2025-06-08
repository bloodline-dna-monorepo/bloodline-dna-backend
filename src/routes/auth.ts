import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { isDefaultAdmin } from '../middlewares/isDefaultAdmin'
import {
  registerHandler,
  loginHandler,
  PasswordChangeHandler,
  refreshAccessTokenHandler
} from '../controllers/authController'
import { changeUserRole } from '../controllers/adminController'

const router = Router()

// Đăng ký người dùng mới
router.post('/register', registerHandler)

// Đăng nhập
router.post('/login', loginHandler)

// Thay đổi mật khẩu
router.post('/password/change-password', authenticate, PasswordChangeHandler)

// Thay đổi vai trò người dùng (chỉ admin mặc định)
router.post('/account/change-role', authenticate, isDefaultAdmin, changeUserRole)

// Làm mới token (Refresh token)
router.post('/refresh-token', refreshAccessTokenHandler)

export default router
