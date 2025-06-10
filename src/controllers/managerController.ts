import { Request, Response } from 'express'
import { poolPromise } from '../config/index'

export const verifyTestResult = async (req: Request, res: Response): Promise<void> => {
  const { resultId, managerId } = req.body

  // Kiểm tra các tham số đầu vào
  if (!resultId || !managerId) {
    res.status(400).json({ message: 'Thiếu resultId hoặc managerId' })
    return
  }

  try {
    const pool = await poolPromise

    // Cập nhật kết quả xét nghiệm
    const result = await pool.request().input('resultId', resultId).input('managerId', managerId).query(`
        UPDATE TestResults
        SET VerifiedBy = @managerId, Status = 'Verified'
        WHERE ResultID = @resultId
      `)

    // Kiểm tra nếu không có bản ghi nào được cập nhật
    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ message: 'Kết quả xét nghiệm không tìm thấy' })
      return
    }

    res.json({ message: 'Kết quả xét nghiệm đã được xác nhận thành công' })
  } catch (error: unknown) {
    // Kiểm tra nếu error là một instance của Error
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi kh��ng xác định' })
    }
  }
}
