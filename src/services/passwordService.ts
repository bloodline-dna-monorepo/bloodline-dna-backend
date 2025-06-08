import bcrypt from 'bcrypt'
import { poolPromise } from '../config'

export const PasswordChange = async (userId: string, password: string, newPassword: string) => {
  const pool = await poolPromise

  // Kiểm tra nếu người dùng tồn tại
  const Result = await pool
    .request()
    .input('userId', userId)
    .query('SELECT password, email FROM Accounts WHERE AccountID = @userId') // Chỉnh lại id thành AccountID

  if (Result.recordset.length === 0) {
    throw new Error('Account not found')
  }

  const user = Result.recordset[0]

  // Kiểm tra mật khẩu cũ có chính xác không
  const match = await bcrypt.compare(password, user.password) // Sử dụng await để chờ kết quả
  if (!match) {
    throw new Error('Old password is wrong')
  }

  // Kiểm tra mật khẩu mới có hợp lệ không
  const passwordregex = /^.{6,12}$/
  if (!passwordregex.test(newPassword)) {
    throw new Error('New password must be between 6 and 12 characters')
  }

  // Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
  if (password === newPassword) {
    throw new Error('New password cannot be the same as the old password')
  }

  // Mã hóa mật khẩu mới
  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  try {
    // Cập nhật mật khẩu mới trong bảng Accounts
    await pool
      .request()
      .input('userId', userId)
      .input('newPasswordHash', newPasswordHash)
      .query('UPDATE Accounts SET password = @newPasswordHash WHERE AccountID = @userId')

    return { message: 'Password change is successful' }
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Xử lý lỗi với message từ Error object
      throw new Error('Error updating password: ' + error.message)
    } else {
      // Nếu lỗi không phải là Error object, thông báo lỗi chung
      throw new Error('Error updating password: Unknown error')
    }
  }
}
