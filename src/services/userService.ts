import bcrypt from 'bcrypt'
import { poolPromise } from '../config' // Kết nối với cơ sở dữ liệu

// Tạo người dùng mới và lưu vào cơ sở dữ liệu
export const createUser = async (email: string, password: string, role: string): Promise<any> => {
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const pool = await poolPromise
    const result = await pool.request().input('email', email).input('password', passwordHash).input('role', role)
      .query(`
        INSERT INTO Users (Email, PasswordHash, Role)
        VALUES (@email, @password, @role)
        SELECT SCOPE_IDENTITY() AS UserID
      `)

    const userId = result.recordset[0].UserID // Lấy UserID từ cơ sở dữ liệu
    return { id: userId, email, role }
  } catch (error) {
    throw new Error('Error creating user')
  }
}

// Tìm người dùng qua email
export const findUserByEmail = async (email: string): Promise<any> => {
  try {
    const pool = await poolPromise
    const result = await pool.request().input('email', email).query(`
      SELECT UserID, Email, PasswordHash, Role FROM Users WHERE Email = @email
    `)
    return result.recordset[0] // Trả về người dùng đầu tiên (nếu có)
  } catch (error) {
    throw new Error('Error finding user')
  }
}

// Kiểm tra mật khẩu
export const verifyPassword = async (user: any, password: string): Promise<boolean> => {
  return bcrypt.compare(password, user.PasswordHash)
}
