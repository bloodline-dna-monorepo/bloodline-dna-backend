import { Request, Response } from 'express'
import { poolPromise } from '../config/index'
import { AuthRequest } from '../middlewares/authenticate'
import { ApprovalTestResult } from '~/services/manager'

export const verifyTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  const { TestResultId } = req.body
  const Mid = req.user?.accountId
  if (Mid === undefined) {
    res.status(401).json({ message: 'Không xác định được tài khoản' })
    return
  }
  try {
    const tokens = await ApprovalTestResult(TestResultId, Mid)
    if (!tokens) {
      res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ' })
      return
    }

    res.json(tokens)
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}
