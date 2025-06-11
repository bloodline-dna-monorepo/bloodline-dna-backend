import type { Request, Response } from 'express'
import { ApiService } from '../services/apiService'

export class StaffDashboardController {
  // Lấy danh sách appointments cho staff
  static async getAppointments(req: Request, res: Response) {
    try {
      const { status, page = 1, limit = 10 } = req.query

      const appointments = await ApiService.getAppointmentsForStaff({
        status: status as string,
        page: Number.parseInt(page as string),
        limit: Number.parseInt(limit as string)
      })

      res.json({
        success: true,
        data: appointments
      })
    } catch (error) {
      console.error('Get appointments error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi lấy danh sách appointments'
      })
    }
  }

  // Cập nhật trạng thái appointment
  static async updateAppointmentStatus(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params
      const { status, kitId, notes } = req.body

      const result = await ApiService.updateAppointmentStatus(Number.parseInt(appointmentId), {
        status,
        kitId,
        notes,
        updatedBy: req.user?.accountId
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Update appointment status error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi cập nhật trạng thái'
      })
    }
  }

  // Nhập kết quả xét nghiệm
  static async submitTestResult(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params
      const { result, notes, images } = req.body

      const testResult = await ApiService.submitTestResult(Number.parseInt(appointmentId), {
        result,
        notes,
        images,
        submittedBy: req.user?.accountId
      })

      res.json({
        success: true,
        data: testResult
      })
    } catch (error) {
      console.error('Submit test result error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi nhập kết quả xét nghiệm'
      })
    }
  }
}
