import { Request, Response } from 'express';
import { poolPromise } from '../config';

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const { accountId, newRole } = req.body;

  if (!accountId || !newRole) {
    res.status(400).json({ message: 'Missing accountId or newRole' });
    return;
  }

  const validRoles = ['admin', 'manager', 'staff', 'customer'];
  if (!validRoles.includes(newRole)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }

  if (newRole === 'admin') {
    res.status(403).json({ message: 'Không thể phân quyền admin mặc định' });
    return;
  }

  try {
    const pool = await poolPromise;

    await pool.request()
      .input('accountId', accountId)
      .input('roleName', newRole)
      .query(`
        UPDATE Account SET role_id = (SELECT id FROM Role WHERE name = @roleName)
        WHERE id = @accountId
      `);

    res.json({ message: 'Role updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
