import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middlewares/authMiddleware'
import { adminService } from '../services/adminService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'

class AdminController {
  // Dashboard Stats
  getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const stats = await adminService.getDashboardStats()
    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.ACTION_PERFORMED_SUCCESS,
      data: stats
    })
  })

  // User Management
  getAllUsers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { search } = req.query
    const users = await adminService.getAllUsers(search as string)
    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.ACTION_PERFORMED_SUCCESS,
      data: users
    })
  })

  updateUserRole = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params
    const { roleId } = req.body

    await adminService.updateUserRole(Number.parseInt(userId), roleId)
    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.ACTION_PERFORMED_SUCCESS
    })
  })

  deleteUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = req.params

    await adminService.deleteUser(Number.parseInt(userId))
    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.ACTION_PERFORMED_SUCCESS
    })
  })

  // Service Management
  getAllServices = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const services = await adminService.getAllServices()
    res.status(200).json({
      success: true,
      message: MESSAGES.SERVICE.SERVICES_RETRIEVED,
      data: services
    })
  })

  createService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const serviceData = req.body
    const newService = await adminService.createService(serviceData)
    res.status(201).json({
      success: true,
      message: MESSAGES.SERVICE.CREATED,
      data: newService
    })
  })

  updateService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { serviceId } = req.params
    const updateData = req.body

    const updatedService = await adminService.updateService(Number.parseInt(serviceId), updateData)
    res.status(200).json({
      success: true,
      message: MESSAGES.SERVICE.UPDATED,
      data: updatedService
    })
  })

  deleteService = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { serviceId } = req.params

    await adminService.deleteService(Number.parseInt(serviceId))
    res.status(200).json({
      success: true,
      message: MESSAGES.SERVICE.DELETED
    })
  })

  getUserById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const accountId = req.params.userId

    const user = await adminService.getUserById(Number.parseInt(accountId))
    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.ACTION_PERFORMED_SUCCESS,
      data: user
    })
  })
}

export const adminController = new AdminController()
