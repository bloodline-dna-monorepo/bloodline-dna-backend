import { getDbPool } from '../config/database'
import { MESSAGES } from '../constants/messages'
import { TestRequestStatus } from '../constants/testRequestStatus'

class FeedbackService {
  /**
   * Lấy danh sách yêu cầu xét nghiệm đã hoàn thành nhưng chưa gửi phản hồi.
   */
  async getPendingFeedbackRequests(accountId: number) {
    try {
      const pool = await getDbPool()
      const request = pool.request()
      request.input('accountId', accountId)

      const result = await request.query(`
        SELECT
            tr.TestRequestID,
            s.ServiceName,
            th.KitID,
            tr.Appointment AS CompletionDate,
            tr.CollectionMethod,
            tr.Status,
            tres.TestResultID
        FROM TestRequests tr
        JOIN Services s ON tr.ServiceID = s.ServiceID
        LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
        LEFT JOIN TestResults tres ON tr.TestRequestID = tres.TestRequestID
        LEFT JOIN Feedbacks f ON tres.TestResultID = f.TestResultID
        WHERE tr.AccountID = @accountId
          AND tr.Status = '${TestRequestStatus.COMPLETED}'
          AND f.FeedbackID IS NULL;
      `)

      return { success: true, data: result.recordset }
    } catch (error) {
      console.error('Error fetching pending feedback requests:', error)
      throw new Error(MESSAGES.FEEDBACK.FETCH_PENDING_FAILED)
    }
  }

  /**
   * Lấy danh sách feedback đã gửi bởi 1 tài khoản.
   */
  async getSubmittedFeedback(accountId: number) {
    try {
      const pool = await getDbPool()
      const request = pool.request()
      request.input('accountId', accountId)

      const result = await request.query(`
        SELECT
            f.FeedbackID,
            f.Rating,
            f.Comment,
            f.CreatedAt,
            tr.TestRequestID,
            s.ServiceName,
            th.KitID,
            tr.Appointment AS CompletionDate,
            tr.CollectionMethod,
            tr.Status
        FROM Feedbacks f
        JOIN TestResults tres ON f.TestResultID = tres.TestResultID
        JOIN TestRequests tr ON tres.TestRequestID = tr.TestRequestID
        JOIN Services s ON tr.ServiceID = s.ServiceID
        LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
        WHERE f.AccountID = @accountId;
      `)

      return { success: true, data: result.recordset }
    } catch (error) {
      console.error('Error fetching submitted feedback:', error)
      throw new Error(MESSAGES.FEEDBACK.FETCH_SUBMITTED_FAILED)
    }
  }
  async getPublicFeedbacks() {
    try {
      const pool = await getDbPool()
      const request = pool.request()

      const result = await request.query(`
        SELECT TOP 5
            f.FeedbackID,
            f.Rating,
            f.Comment,
            f.CreatedAt,
            a.Email as FullName 
        FROM Feedbacks f
        JOIN Accounts a ON f.AccountID = a.AccountID
		JOIN dbo.UserProfiles uf ON uf.AccountID = a.AccountID
        WHERE f.Rating >= 4 
        ORDER BY f.CreatedAt DESC
      `)

      return { success: true, data: result.recordset }
    } catch (error) {
      console.error('Error fetching public feedbacks:', error)
      throw new Error(MESSAGES.FEEDBACK.Get)
    }
  }
  /**
   * Gửi feedback mới cho 1 kết quả xét nghiệm.
   */
  async submitFeedback(accountId: number, testResultId: number, rating: number, comment: string) {
    try {
      const pool = await getDbPool()
      const request = pool.request()
      request.input('accountId', accountId)
      request.input('testResultId', testResultId)
      request.input('rating', rating)
      request.input('comment', comment)

      // Kiểm tra feedback đã tồn tại chưa
      const existingFeedback = await request.query(`
        SELECT FeedbackID FROM Feedbacks WHERE TestResultID = @testResultId
      `)
      if (existingFeedback.recordset.length > 0) {
        throw new Error(MESSAGES.FEEDBACK.ALREADY_SUBMITTED)
      }

      // Kiểm tra quyền gửi feedback
      const testResultOwner = await request.query(`
        SELECT tr.AccountID
        FROM TestResults tres
        JOIN TestRequests tr ON tres.TestRequestID = tr.TestRequestID
        WHERE tres.TestResultID = @testResultId;
      `)
      if (!testResultOwner.recordset.length || testResultOwner.recordset[0].AccountID !== accountId) {
        throw new Error(MESSAGES.FEEDBACK.NOT_AUTHORIZED)
      }

      const result = await request.query(`
        INSERT INTO Feedbacks (TestResultID, AccountID, Comment, Rating, CreatedAt)
        VALUES (@testResultId, @accountId, @comment, @rating, GETDATE());
      `)
      const feedback = await request.query('SELECT * FROM Feedbacks WHERE TestResultID = @testResultId;')

      return { success: true, data: feedback.recordset[0] }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw error
    }
  }

  async updateFeedback(accountId: number, feedbackId: number, rating: number, comment: string) {
    try {
      const pool = await getDbPool()
      const request = pool.request()
      request.input('accountId', accountId)
      request.input('feedbackId', feedbackId)
      request.input('rating', rating)
      request.input('comment', comment)

      // Kiểm tra feedback có tồn tại và thuộc về user không
      const existingFeedback = await request.query(`
        SELECT FeedbackID, AccountID FROM Feedbacks WHERE FeedbackID = @feedbackId
      `)

      if (!existingFeedback.recordset.length) {
        throw new Error(MESSAGES.FEEDBACK.NOT_FOUND)
      }

      if (existingFeedback.recordset[0].AccountID !== accountId) {
        throw new Error(MESSAGES.FEEDBACK.NOT_AUTHORIZED)
      }

      // Cập nhật feedback
      await request.query(`
        UPDATE Feedbacks 
        SET Comment = @comment, Rating = @rating, CreatedAt = GETDATE()
        WHERE FeedbackID = @feedbackId AND AccountID = @accountId
      `)

      // Lấy feedback đã cập nhật
      const updatedFeedback = await request.query(`
        SELECT * FROM Feedbacks WHERE FeedbackID = @feedbackId
      `)

      return { success: true, data: updatedFeedback.recordset[0] }
    } catch (error) {
      console.error('Error updating feedback:', error)
      throw error
    }
  }
}

export const feedbackService = new FeedbackService()
