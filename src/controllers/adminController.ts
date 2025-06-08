import { Request, Response } from 'express'
import { poolPromise } from '../config'

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const { email, newRole } = req.body

  // Kiểm tra các tham số đầu vào
  if (!email || !newRole) {
    res.status(400).json({ message: 'Missing email or newRole' })
    return
  }

  const validRoles = ['admin', 'manager', 'staff', 'customer']
  if (!validRoles.includes(newRole)) {
    res.status(400).json({ message: 'Invalid role' })
    return
  }

  if (newRole === 'admin') {
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
