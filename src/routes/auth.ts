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

router.post('/register', registerHandler)
router.post('/login', loginHandler)

router.post('/password/change-password', authenticate, PasswordChangeHandler)

router.post('/account/change-role', authenticate, isDefaultAdmin, changeUserRole)

router.post('/refresh-token', refreshAccessTokenHandler) // <--- route refresh token
export default router
