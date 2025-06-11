import express from 'express'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerAppointments,
  getAppointmentDetails
} from '../controllers/customerController'

const router = express.Router()

// Get customer profile
router.get('/profile', authenticate, authorize(['Customer']), getCustomerProfile)

// Update customer profile
router.put('/profile', authenticate, authorize(['Customer']), updateCustomerProfile)

// Get customer appointments
router.get('/appointments', authenticate, authorize(['Customer']), getCustomerAppointments)

// Get appointment details
router.get('/appointments/:appointmentId', authenticate, authorize(['Customer']), getAppointmentDetails)

export default router
