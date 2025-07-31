import type { Request, Response, NextFunction } from 'express'
import { staffService } from '../services/staffService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'
import type { AuthRequest } from '../middlewares/authMiddleware'

class StaffController {
  getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const staffId = req.user?.accountId

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const stats = await staffService.getDashboardStats(staffId)
    const recentRequests = await staffService.getRecentUnconfirmedRequests()

    res.status(200).json({
      message: 'Dashboard stats retrieved successfully',
      data: {
        stats,
        recentRequests
      }
    })
  })

  getUnconfirmedRequests = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requests = await staffService.getUnconfirmedRequests()

    res.status(200).json({
      message: 'Unconfirmed requests retrieved successfully',
      data: requests
    })
  })
  getRequestFullDetail = async (req: Request, res: Response) => {
    try {
      const requestId = Number.parseInt(req.params.requestId)
      const request = await staffService.getRequestFullDetail(requestId)
      res.json({
        success: true,
        data: request
      })
    } catch (error) {
      console.error('Error getting request full detail:', error)
      res.status(500).json({
        success: false,
        message: MESSAGES.ERROR.SERVER_ERROR
      })
    }
  }
  getConfirmedRequests = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const staffId = req.user?.accountId

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const requests = await staffService.getConfirmedRequests(staffId)

    res.status(200).json({
      message: 'Confirmed requests retrieved successfully',
      data: requests
    })
  })

  getRequestById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { requestId } = req.params
    const request = await staffService.getRequestById(Number.parseInt(requestId))

    res.status(200).json({
      message: 'Request details retrieved successfully',
      data: request
    })
  })

  confirmRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { requestId } = req.params
    const staffId = req.user?.accountId

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const request = await staffService.confirmRequest(Number.parseInt(requestId), staffId)

    res.status(200).json({
      message: 'Request confirmed successfully',
      data: request
    })
  })

  updateRequestStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { requestId } = req.params
    const { status } = req.body
    const staffId = req.user?.accountId

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const request = await staffService.updateRequestStatus(Number.parseInt(requestId), status, staffId)

    res.status(200).json({
      message: 'Request status updated successfully',
      data: request
    })
  })

  // New endpoint for confirming sample
  confirmSample = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { requestId } = req.params
    const staffId = req.user?.accountId

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const request = await staffService.confirmSample(Number.parseInt(requestId), staffId)

    res.status(200).json({
      message: 'Sample confirmed successfully',
      data: request
    })
  })

  createTestResult = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { requestId } = req.params
    const staffId = req.user?.accountId
    const { result } = req.body

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    await staffService.createTestResult(Number.parseInt(requestId), staffId, result)

    res.status(200).json({
      message: 'Test result created successfully'
    })
  })
  getVerifiedResults = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const staffId = req.user?.accountId

    if (!staffId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const results = await staffService.getVerifiedResults(staffId)

    res.status(200).json({
      message: "Verified results retrieved successfully",
      data: results,
    })
  })

  getVerifiedResultDetail = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { resultId } = req.params
    const result = await staffService.getVerifiedResultDetail(Number.parseInt(resultId))

    res.status(200).json({
      message: "Verified result detail retrieved successfully",
      data: result,
    })
  })
}

export const staffController = new StaffController()
