import express from 'express'
import { CreateService, DeleteService, UpdateService, ViewService } from '~/controllers/adminController'
import { authenticate } from '~/middlewares/authenticate'
import { isDefaultAdmin } from '~/middlewares/isDefaultAdmin'

const router = express.Router()

router.post('/account/create_service', authenticate, isDefaultAdmin, CreateService)
router.get('/account/view_service', authenticate, isDefaultAdmin, ViewService)
router.put('/account/update_service/:serid', authenticate, isDefaultAdmin, UpdateService)
router.delete('/account/delete_service', authenticate, isDefaultAdmin, DeleteService)

export default router
