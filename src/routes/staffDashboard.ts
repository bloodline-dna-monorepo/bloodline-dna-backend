import express from "express"
import {
  StaffDashboardController
} from "../controllers/staffDashboardController"
import { authenticate } from "../middlewares/authenticate"
import { authorize } from "../middlewares/authorize"

const router = express.Router()

// Staff xem danh sách appointments
router.get("/appointments", authenticate, authorize(["Staff", "Manager", "Admin"]), StaffDashboardController.getAppointments)

// Staff cập nhật trạng thái appointment
router.put("/appointments/:id/status", authenticate, authorize(["Staff", "Manager", "Admin"]), StaffDashboardController.updateAppointmentStatus)

// Staff submit kết quả test
router.post("/test-results", authenticate, authorize(["Staff", "Manager", "Admin"]), StaffDashboardController.submitTestResult)

export default router
