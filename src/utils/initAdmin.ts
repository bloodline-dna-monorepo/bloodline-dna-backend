import bcrypt from 'bcrypt'
import { poolPromise, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../config'

export async function initDefaultAdmin() {
  const pool = await poolPromise

  try {
    // Kiểm tra xem role 'admin' có tồn tại không
    const roleResult = await pool
      .request()
      .input('roleName', 'admin')
      .query('SELECT RoleID FROM Roles WHERE RoleName = @roleName')

    if (roleResult.recordset.length === 0) {
      throw new Error('Role "admin" chưa tồn tại trong DB.')
    }

    const adminRoleId = roleResult.recordset[0].RoleID

    // Kiểm tra xem admin mặc định đã tồn tại chưa
    const existingAdmin = await pool
      .request()
      .input('email', DEFAULT_ADMIN_EMAIL)
      .query('SELECT Email FROM Accounts WHERE Email = @email') // Lấy chỉ trường Email

    if (existingAdmin.recordset.length === 0) {
      // Nếu chưa có admin mặc định, tạo mới
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)

      // Thêm tài khoản admin vào bảng Accounts
      await pool
        .request()
        .input('email', DEFAULT_ADMIN_EMAIL)
        .input('password', passwordHash)
        .input('role_id', adminRoleId).query(`
          INSERT INTO Accounts (Email, PasswordHash, RoleID)
          VALUES (@email, @password, @role_id);
        `)

      console.log('Admin mặc định đã được tạo:', DEFAULT_ADMIN_EMAIL)
    } else {
      console.log('Admin mặc định đã tồn tại.')
    }
  } catch (error: unknown) {
    // Cải thiện xử lý lỗi
    if (error instanceof Error) {
      console.error('Error initializing default admin:', error.message)
      throw new Error('Không thể khởi tạo admin mặc định: ' + error.message)
    } else {
      console.error('Unknown error occurred while initializing default admin.')
      throw new Error('Failed to initialize default admin due to an unknown error.')
    }
  }
}
