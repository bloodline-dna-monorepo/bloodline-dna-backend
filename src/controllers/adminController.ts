import { Request, Response } from 'express'
import { poolPromise } from '../config'
import { createService } from '~/services/Admin'

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const { email, newRole } = req.body

  // Kiểm tra các tham số đầu vào
  if (!email || !newRole) {
    res.status(400).json({ message: 'Missing email or newRole' })
    return
  }

  const validRoles = ['Admin', 'Manager', 'Staff', 'Customer']
  if (!validRoles.includes(newRole)) {
    res.status(400).json({ message: 'Invalid role' })
    return
  }

  if (newRole === 'Admin') {
    res.status(403).json({ message: 'Cannot assign default admin role' })
    return
  }

  try {
    const pool = await poolPromise

    // Cập nhật quyền người dùng
    await pool
      .request()
      .input('email', email)
      .input('roleName', newRole)
      .query(
        `UPDATE Accounts
     SET RoleID = (SELECT RoleID FROM Roles WHERE RoleName = @roleName)
     WHERE Email = @email`
      )

    res.json({ message: 'Role updated successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
export const CreateService = async (req: Request, res: Response): Promise<void> => {
  const { ServiceName, Description, Catgory, NumberSample } = req.body
  if (!ServiceName || !Description || !Catgory || !NumberSample) {
    res.status(400).json({ message: 'Missing some value' })
  } else if (NumberSample != 2 || NumberSample != 3) {
    res.status(400).json({ message: 'NumberSample must between 2 and 3' })
  }
  try {
    const service = await createService(ServiceName, Description, Catgory, NumberSample)
    if (!service) {
      res.status(409).json({ message: 'Error is happing' })
      return
    }
    res.json(service)
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}
export const ViewService = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = await poolPromise
    const SerList = pool.request().query('SELECT * From Services')
    res.json(SerList)
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}
export const UpdateService = async (req: Request, res: Response): Promise<void> => {
  const { serid } = req.params
  const { Price } = req.body
  // Kiểm tra dữ liệu đầu vào
  if (!Price || typeof Price !== 'number') {
    res.status(400).json({ message: 'Price must be a valid number' })
    return
  }

  if (Price < 1000) {
    res.status(401).json({ message: 'Price must be greater or equal than 1000000' })
  }
  try {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input('serid', serid)
      .input('price', Price)
      .query('Update PriceDetails Set Price = @price WHERE ServiceID = @serid')

    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ message: 'Service not found or update failed' })
      return
    }

    res.status(200).json({ message: 'Update success' })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}
export const DeleteService = async (req: Request, res: Response): Promise<void> => {
  const serid = req.body
  try {
    const pool = await poolPromise
    const de = await pool.request().input('serid', serid).query('DELETE FROM Services WHERE ServiceID = @serid')
    if (de.rowsAffected[0] === 0) {
      res.status(400).json({ message: 'DELETE FAILED' })
    }
    res.status(200).json({ message: 'DELETE Success' })
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}
