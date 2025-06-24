import { Router } from 'express'
import { serviceController } from '../controllers/serviceController'
import { authenticate, authorize } from '../middlewares/authMiddleware'

const router = Router()

// Get all services (public)
router.get('/', serviceController.getAllServices)

// Get service by ID (public)
router.get('/:serviceId', serviceController.getServiceById)

// Admin only routes
router.post(
  '/',
  authenticate,
  authorize(['Admin']),

  serviceController.createService
)

router.put('/:serviceId', authenticate, authorize(['Admin']), serviceController.updateService)

router.delete('/:serviceId', authenticate, authorize(['Admin']), serviceController.deleteService)

export { router as serviceRoutes }
