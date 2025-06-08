import express, { Request, Response } from 'express'
import { verifyTestResult } from '../controllers/managerController'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'

const router = express.Router()

// Manager xác nhận kết quả xét nghiệm
router.put(
  '/test-results/verify',
  authenticate,
  authorize(['manager']),
  async (req: Request, res: Response): Promise<void> => {
    const { resultId, managerId } = req.body

    // Kiểm tra tham số đầu vào
    if (!resultId || !managerId) {
      res.status(400).json({ message: 'Thiếu resultId hoặc managerId' })
      return
    }

    try {
      // Gọi controller để xử lý logic
      const response = await verifyTestResult(resultId, managerId) // Truyền tham số vào controller thay vì req, res

      res.status(200).json(response) // Trả lại phản hồi từ controller
    } catch (error) {
      // Xử lý lỗi không mong muốn
      if (error instanceof Error) {
        res.status(500).json({ message: error.message })
      } else {
        res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
      }
    }
  }
)

export default router
