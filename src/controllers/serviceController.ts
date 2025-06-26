import type { Request, Response, NextFunction } from 'express'
import { serviceService } from '../services/serviceService'
import { MESSAGES } from '../constants/messages'
import { asyncHandler } from '../middlewares/errorMiddleware'

class ServiceController {
  getAllServices = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const services = await serviceService.getAllServices()
    res.status(200).json({ message: MESSAGES.SERVICE.SERVICES_RETRIEVED, services })
    return
  })

  getServiceByType = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceType = req.params.serviceType
    const service = await serviceService.getServiceByName(serviceType)

    if (!service) {
      res.status(404).json({ message: MESSAGES.SERVICE.NOT_FOUND })
      return
    }

    res.status(200).json({ message: MESSAGES.SERVICE.SERVICES_RETRIEVED, data: service })
  })

  getServiceById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { serviceId } = req.params
    const service = await serviceService.getServiceById(parseInt(serviceId))

    if (!service) {
      res.status(404).json({ message: MESSAGES.SERVICE.NOT_FOUND, service })
      return
    }

    res.status(404).json({ message: MESSAGES.SERVICE.SERVICES_RETRIEVED, service })
    return
  })

  createService = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const serviceData = req.body
    const newService = await serviceService.createService(serviceData)
    res.status(201).json({ message: MESSAGES.SERVICE.CREATED, newService })
    return
  })

  updateService = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { serviceId } = req.params
    const updateData = req.body

    const updatedService = await serviceService.updateService(parseInt(serviceId), updateData)

    if (!updatedService) {
      res.status(404).json({ message: MESSAGES.SERVICE.NOT_FOUND, updatedService })
      return
    }
    res.status(200).json({ message: MESSAGES.SERVICE.UPDATED, updatedService })
    return
  })

  deleteService = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { serviceId } = req.params
    const deleted = await serviceService.deleteService(parseInt(serviceId))

    if (!deleted) {
      res.status(404).json({ message: MESSAGES.SERVICE.NOT_FOUND, deleted })
      return
    }
    res.status(200).json({ message: MESSAGES.SERVICE.DELETED, deleted })
    return
  })
}

export const serviceController = new ServiceController()
