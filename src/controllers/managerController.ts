import type { Response } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { managerService } from '../services/managerService'
import { asyncHandler } from '../middlewares/errorMiddleware'

class ManagerController {
  // Dashboard
  getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const stats = await managerService.getDashboardStats()
    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats
    })
  })

  // Test Results Management
  getTestResults = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const testResults = await managerService.getTestResults()
    res.status(200).json({
      success: true,
      message: 'Test results retrieved successfully',
      data: testResults
    })
  })

  getTestResultById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { testResultId } = req.params
    const testResult = await managerService.getTestResultById(Number(testResultId))

    if (!testResult) {
      res.status(404).json({
        success: false,
        message: 'Test result not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Test result retrieved successfully',
      data: testResult
    })
  })

  approveTestResult = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { testResultId } = req.params
    const managerId = req.user?.accountId

    const result = await managerService.approveTestResult(Number(testResultId), managerId)
    res.status(200).json({
      success: true,
      message: 'Test result approved successfully',
      data: result
    })
  })

  rejectTestResult = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { testResultId } = req.params
    const { reason } = req.body
    const managerId = req.user?.accountId

    const result = await managerService.rejectTestResult(Number(testResultId), managerId, reason)
    res.status(200).json({
      success: true,
      message: 'Test result rejected successfully',
      data: result
    })
  })

  // Feedback Management
  getFeedbacks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const feedbacks = await managerService.getFeedbacks()
    res.status(200).json({
      success: true,
      message: 'Feedbacks retrieved successfully',
      data: feedbacks
    })
  })

  getFeedbackStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const stats = await managerService.getFeedbackStats()
    res.status(200).json({
      success: true,
      message: 'Feedback stats retrieved successfully',
      data: stats
    })
  })

  // Blog Management
  getBlogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const blogs = await managerService.getBlogs()
    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogs
    })
  })

  getBlogById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { blogId } = req.params
    const blog = await managerService.getBlogById(Number(blogId))

    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: blog
    })
  })

  createBlog = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const blogData = req.body
    const authorId = req.user?.accountId

    const blog = await managerService.createBlog({ ...blogData, AuthorID: authorId })
    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    })
  })

  updateBlog = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { blogId } = req.params
    const blogData = req.body

    const blog = await managerService.updateBlog(Number(blogId), blogData)
    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    })
  })

  deleteBlog = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { blogId } = req.params

    await managerService.deleteBlog(Number(blogId))
    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    })
  })
}

export const managerController = new ManagerController()
