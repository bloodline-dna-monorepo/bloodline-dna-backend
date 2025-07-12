import type { BlogPostManage, FeedbackManage, ManagerDashboardStats, TestResultManage } from '../types/type'
import { getDbPool } from '../config/database'

class ManagerService {
  async getDashboardStats(): Promise<ManagerDashboardStats> {
    const pool = await getDbPool()

    try {
      // Get total tests
      const totalTestsResult = await pool.request().query(`
      SELECT COUNT(*) as totalTests FROM TestRequests
    `)

      // Get revenue
      const revenueResult = await pool.request().query(`
      SELECT SUM(s.Price) as revenue 
      FROM TestRequests tr
      JOIN Services s ON tr.ServiceID = s.ServiceID
   
    `)

      // Get average rating
      const avgRatingResult = await pool.request().query(`
      SELECT AVG(CAST(Rating as FLOAT)) as avgRating 
      FROM Feedbacks
    `)

      // Get completed tests
      const completedResult = await pool.request().query(`
      SELECT COUNT(*) as completed 
      FROM TestRequests 
      WHERE Status = 'Completed'
    `)

      // Get pending test results
      const pendingResult = await pool.request().query(`
      SELECT COUNT(*) as pending 
      FROM TestResults 
      WHERE Status = 'Pending'
    `)

      // Get total feedback
      const feedbackResult = await pool.request().query(`
      SELECT COUNT(*) as feedback FROM Feedbacks
    `)

      // Get monthly revenue (last 6 months)
      const monthlyRevenueResult = await pool.request().query(`
      SELECT 
        MONTH(tr.CreatedAt) as month,
        SUM(s.Price) as revenue
      FROM TestRequests tr
      JOIN Services s ON tr.ServiceID = s.ServiceID
      WHERE 
         tr.CreatedAt >= DATEADD(month, -6, GETDATE())
      GROUP BY MONTH(tr.CreatedAt)
      ORDER BY MONTH(tr.CreatedAt)
    `)

      // Get service distribution (only actual services)
      const serviceDistributionResult = await pool.request().query(`
      SELECT 
        s.ServiceName,
        COUNT(*) as count
      FROM TestRequests tr
      JOIN Services s ON tr.ServiceID = s.ServiceID
      GROUP BY s.ServiceName, s.ServiceID
      ORDER BY COUNT(*) DESC
    `)

      // Process monthly revenue data
      const monthlyRevenue = Array(6).fill(0)
      monthlyRevenueResult.recordset.forEach((row) => {
        const currentMonth = new Date().getMonth() + 1
        const monthIndex = (row.month - currentMonth + 6) % 6
        if (monthIndex >= 0 && monthIndex < 6) {
          monthlyRevenue[monthIndex] = row.revenue || 0
        }
      })

      // Process service distribution data
      const serviceDistribution = serviceDistributionResult.recordset.map((row) => row.count)
      const serviceNames = serviceDistributionResult.recordset.map((row) => row.ServiceName)

      return {
        totalTests: totalTestsResult.recordset[0]?.totalTests || 0,
        revenue: revenueResult.recordset[0]?.revenue || 0,
        avgRating: Number((avgRatingResult.recordset[0]?.avgRating || 0).toFixed(1)),
        completed: completedResult.recordset[0]?.completed || 0,
        pending: pendingResult.recordset[0]?.pending || 0,
        feedback: feedbackResult.recordset[0]?.feedback || 0,
        monthlyRevenue,
        serviceDistribution,
        serviceNames
      }
    } catch (error) {
      console.error('Error getting manager dashboard stats:', error)
      throw error
    }
  }

  async getTestResults(): Promise<TestResultManage[]> {
    const pool = await getDbPool()

    const result = await pool.request().query(`
      SELECT 
        tr_result.TestResultID,
        tr_result.TestRequestID,
        up.FullName as CustomerName,
        s.ServiceType,
        staff.FullName as StaffName,
        tr_result.Status,
        tr_result.Result,
        tr_result.EnterDate as SampleDate,
        tr_result.EnterDate as CreatedAt
      FROM TestResults tr_result
      JOIN TestRequests tr ON tr_result.TestRequestID = tr.TestRequestID
      JOIN Services s ON tr.ServiceID = s.ServiceID
      JOIN Accounts a ON tr.AccountID = a.AccountID
      JOIN UserProfiles up ON a.AccountID = up.AccountID
      LEFT JOIN UserProfiles staff ON tr_result.EnterBy = staff.AccountID
      ORDER BY tr_result.EnterDate DESC
    `)

    return result.recordset
  }

  async getTestResultById(testResultId: number): Promise<TestResultManage | null> {
    const pool = await getDbPool()

    const result = await pool.request().input('testResultId', testResultId).query(`
        SELECT 
          tr_result.TestResultID,
          tr_result.TestRequestID,
          up.FullName as CustomerName,
          s.ServiceType,
          staff.FullName as StaffName,
          tr_result.Status,
          tr_result.Result,
          tr_result.EnterDate as SampleDate,
          tr_result.EnterDate as CreatedAt
        FROM TestResults tr_result
        JOIN TestRequests tr ON tr_result.TestRequestID = tr.TestRequestID
        JOIN Services s ON tr.ServiceID = s.ServiceID
        JOIN Accounts a ON tr.AccountID = a.AccountID
        JOIN UserProfiles up ON a.AccountID = up.AccountID
        LEFT JOIN UserProfiles staff ON tr_result.EnterBy = staff.AccountID
        WHERE tr_result.TestResultID = @testResultId
      `)

    return result.recordset[0] || null
  }

  async approveTestResult(testResultId: number, managerId: number | undefined): Promise<{ message: string }> {
    const pool = await getDbPool()

    await pool.request().input('testResultId', testResultId).input('managerId', managerId).query(`
        UPDATE TestResults 
        SET Status = 'Verified', 
            ConfirmBy = @managerId,
            ConfirmedAt = GETDATE()
        WHERE TestResultID = @testResultId
      `)

    // Update test request status to completed
    await pool.request().input('testResultId', testResultId).query(`
        UPDATE TestRequests 
        SET Status = 'Completed'
        WHERE TestRequestID = (
          SELECT TestRequestID FROM TestResults WHERE TestResultID = @testResultId
        )
      `)

    return { message: 'Test result approved successfully' }
  }

  async rejectTestResult(
    testResultId: number,
    managerId: number | undefined,
    reason?: string
  ): Promise<{ message: string }> {
    const pool = await getDbPool()

    await pool
      .request()
      .input('testResultId', testResultId)
      .input('managerId', managerId)
      .input('reason', reason || '').query(`
        UPDATE TestResults 
        SET Status = 'Rejected', 
            ConfirmBy = @managerId,
            ConfirmedAt = GETDATE()
        WHERE TestResultID = @testResultId
      `)

    return { message: 'Test result rejected successfully' }
  }

  async getFeedbacks(): Promise<FeedbackManage[]> {
    const pool = await getDbPool()

    const result = await pool.request().query(`
      SELECT 
        f.FeedbackID,
        f.TestResultID,
        f.Rating,
        f.Comment,
        up.FullName,
        f.CreatedAt
      FROM Feedbacks f
      JOIN TestResults tr ON f.TestResultID = tr.TestResultID
      JOIN TestRequests treq ON tr.TestRequestID = treq.TestRequestID
      JOIN Accounts a ON treq.AccountID = a.AccountID
      JOIN UserProfiles up ON a.AccountID = up.AccountID
      ORDER BY f.CreatedAt DESC
    `)

    return result.recordset
  }

  async getFeedbackStats(): Promise<{
    avgRating: number
    totalFeedbacks: number
    distribution: number[]
  }> {
    const pool = await getDbPool()

    const avgResult = await pool.request().query(`
      SELECT AVG(CAST(Rating as FLOAT)) as avgRating FROM Feedbacks
    `)

    const totalResult = await pool.request().query(`
      SELECT COUNT(*) as total FROM Feedbacks
    `)

    const distributionResult = await pool.request().query(`
      SELECT 
        Rating,
        COUNT(*) as count
      FROM Feedbacks
      GROUP BY Rating
      ORDER BY Rating DESC
    `)

    const distribution = [0, 0, 0, 0, 0] // [5-star, 4-star, 3-star, 2-star, 1-star]
    distributionResult.recordset.forEach((row) => {
      if (row.Rating >= 1 && row.Rating <= 5) {
        distribution[5 - row.Rating] = row.count
      }
    })

    return {
      avgRating: Number((avgResult.recordset[0]?.avgRating || 0).toFixed(1)),
      totalFeedbacks: totalResult.recordset[0]?.total || 0,
      distribution
    }
  }

  async getBlogs(): Promise<BlogPostManage[]> {
    const pool = await getDbPool()

    const result = await pool.request().query(`
      SELECT 
        b.BlogID,
        b.Title,
        b.Description,
        up.FullName as Author,
        b.Image,
        b.CreatedAt
      FROM Blogs b
      JOIN Accounts a ON b.AccountID = a.AccountID
      JOIN UserProfiles up ON a.AccountID = up.AccountID
      ORDER BY b.CreatedAt DESC
    `)

    return result.recordset
  }

  async getBlogById(blogId: number): Promise<BlogPostManage | null> {
    const pool = await getDbPool()

    const result = await pool.request().input('blogId', blogId).query(`
        SELECT 
          b.BlogID,
          b.Title,
          b.Description,
          up.FullName as Author,
          b.Image,
          b.CreatedAt
        FROM Blogs b
        JOIN Accounts a ON b.AccountID = a.AccountID
        JOIN UserProfiles up ON a.AccountID = up.AccountID
        WHERE b.BlogID = @blogId
      `)

    return result.recordset[0] || null
  }

  async createBlog(blogData: {
    Title: string
    Description: string
    Image: string
    AuthorID: number
  }): Promise<BlogPostManage> {
    const pool = await getDbPool()

    const result = await pool
      .request()
      .input('title', blogData.Title)
      .input('content', blogData.Description)
      .input('imageUrl', blogData.Image)
      .input('authorId', blogData.AuthorID).query(`
        INSERT INTO Blogs (Title, Description, Image, AccountID, CreatedAt)
        OUTPUT INSERTED.BlogID
        VALUES (@title, @content, @imageUrl, @authorId, GETDATE())
      `)

    const blogId = result.recordset[0].BlogID
    return this.getBlogById(blogId) as Promise<BlogPostManage>
  }

  async updateBlog(
    blogId: number,
    blogData: {
      Title: string
      Description: string
      Image: string
      AuthorID: number
    }
  ): Promise<BlogPostManage> {
    const pool = await getDbPool()

    const updateFields = []
    const inputs: { [key: string]: string | number } = { blogId }

    if (blogData.Title) {
      updateFields.push('Title = @title')
      inputs.title = blogData.Title
    }
    if (blogData.Description) {
      updateFields.push('Description = @content')
      inputs.content = blogData.Description
    }

    if (blogData.Image !== undefined) {
      updateFields.push('Image = @imageUrl')
      inputs.imageUrl = blogData.Image
    }

    const request = pool.request()
    Object.keys(inputs).forEach((key) => {
      request.input(key, inputs[key])
    })

    await request.query(`
      UPDATE Blogs 
      SET ${updateFields.join(', ')}
      WHERE BlogID = @blogId
    `)

    return this.getBlogById(blogId) as Promise<BlogPostManage>
  }

  async deleteBlog(blogId: number): Promise<void> {
    const pool = await getDbPool()

    await pool.request().input('blogId', blogId).query(`DELETE FROM Blogs WHERE BlogID = @blogId`)
  }
}

export const managerService = new ManagerService()
