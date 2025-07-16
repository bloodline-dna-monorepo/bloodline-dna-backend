import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { feedbackService } from '../services/feedbackService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'

class FeedbackController {
  getPendingFeedback = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const accountId = req.user?.accountId

    if (!accountId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const { success, data } = await feedbackService.getPendingFeedbackRequests(accountId)

    if (success) {
      res.status(200).json({
        message: MESSAGES.FEEDBACK.PENDING_RETRIEVED,
        data
      })
    } else {
      res.status(404).json({ message: MESSAGES.FEEDBACK.NOT_FOUND_PENDING })
    }
  })

  getSubmittedFeedback = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const accountId = req.user?.accountId

    if (!accountId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    const { success, data } = await feedbackService.getSubmittedFeedback(accountId)

    if (success) {
      res.status(200).json({
        message: MESSAGES.FEEDBACK.SUBMITTED_RETRIEVED,
        data
      })
    } else {
      res.status(404).json({ message: MESSAGES.FEEDBACK.NOT_FOUND_SUBMITTED })
    }
  })
  getPublicFeedbacks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { success, data } = await feedbackService.getPublicFeedbacks()

    if (success) {
      res.status(200).json({
        data: data
      })
    } else {
      res.status(404).json({ message: 'không tìm thấy Feedback' })
    }
  })
  submitFeedback = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const accountId = req.user?.accountId
    const { testResultId, rating, comment } = req.body

    if (!accountId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    if (!testResultId || !rating || !comment) {
      res.status(400).json({ message: MESSAGES.FEEDBACK.MISSING_FIELDS })
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: MESSAGES.FEEDBACK.INVALID_RATING })
      return
    }

    if (comment.length < 20 || comment.length > 50) {
      res.status(400).json({ message: MESSAGES.FEEDBACK.INVALID_COMMENT_LENGTH })
      return
    }

    try {
      const { success, data } = await feedbackService.submitFeedback(accountId, testResultId, rating, comment)

      if (success) {
        res.status(201).json({
          message: MESSAGES.FEEDBACK.SUBMIT_SUCCESS,
          feedback: data
        })
      } else {
        res.status(500).json({ message: MESSAGES.FEEDBACK.SUBMIT_FAILED })
      }
    } catch (error: any) {
      if (error.message === MESSAGES.FEEDBACK.ALREADY_SUBMITTED) {
        res.status(409).json({ message: error.message })
      } else if (error.message === MESSAGES.FEEDBACK.NOT_AUTHORIZED) {
        res.status(403).json({ message: error.message })
      } else {
        next(error)
      }
    }
  })

  updateFeedback = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const accountId = req.user?.accountId
    const { feedbackId } = req.params
    const { rating, comment } = req.body

    if (!accountId) {
      res.status(401).json({ message: MESSAGES.ERROR.UNAUTHORIZED })
      return
    }

    if (!feedbackId || !rating || !comment) {
      res.status(400).json({ message: MESSAGES.FEEDBACK.MISSING_FIELDS })
      return
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: MESSAGES.FEEDBACK.INVALID_RATING })
      return
    }

    if (comment.length < 20 || comment.length > 50) {
      res.status(400).json({ message: MESSAGES.FEEDBACK.INVALID_COMMENT_LENGTH })
      return
    }

    try {
      const { success, data } = await feedbackService.updateFeedback(
        accountId,
        Number.parseInt(feedbackId),
        rating,
        comment,
      )

      if (success) {
        res.status(200).json({
          message: MESSAGES.FEEDBACK.UPDATE_SUCCESS,
          feedback: data,
        })
      } else {
        res.status(500).json({ message: MESSAGES.FEEDBACK.UPDATE_FAILED })
      }
    } catch (error: any) {
      if (error.message === MESSAGES.FEEDBACK.NOT_FOUND) {
        res.status(404).json({ message: error.message })
      } else if (error.message === MESSAGES.FEEDBACK.NOT_AUTHORIZED) {
        res.status(403).json({ message: error.message })
      } else {
        next(error)
      }
    }
  })
}

export const feedbackController = new FeedbackController()
