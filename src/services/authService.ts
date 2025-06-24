import bcrypt from 'bcrypt'
import { getDbPool } from '../config/database'
import jwt from 'jsonwebtoken'
import { config } from '../config/config'

export const register = async (email: string, password: string, confirmpassword: string) => {
  // Kiểm tra mật khẩu (độ dài 6-12 ký tự)
  const passwordregex = /^.{6,12}$/
  if (!passwordregex.test(password)) {
    throw new Error('Mật khẩu phải có độ dài từ 6 đến 12 ký tự')
  }

  // Kiểm tra mật khẩu trùng khớp
  if (password !== confirmpassword) {
    throw new Error('Mật khẩu không trùng khớp')
  }

  // Kiểm tra định dạng email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
  if (!emailRegex.test(email)) {
    throw new Error('Email không hợp lệ')
  }

  const pool = await getDbPool()

  // Kiểm tra nếu email đã tồn tại trong bảng Accounts
  const result = await pool.request().input('email', email).query(`
    SELECT Email FROM Accounts WHERE Email = @Email
  `)

  if (result.recordset.length > 0) {
    throw new Error('Email đã tồn tại')
  }

  // Lấy role "Customer" từ bảng Roles
  const roleAcc = await pool.request().input('name', 'Customer').query(`
    SELECT * FROM Roles WHERE RoleName = @name
  `)

  if (roleAcc.recordset.length === 0) {
    throw new Error('Role không tồn tại')
  }

  const role = roleAcc.recordset[0]

  // Mã hóa mật khẩu
  const passwordHash = await bcrypt.hash(password, 10)

  // Lưu tài khoản vào cơ sở dữ liệu
  const i = await pool
    .request()
    .input('email', email)
    .input('password', passwordHash) // Lưu mật khẩu đã mã hóa
    .input('role_id', role.RoleID) // Dùng RoleID thay vì role_name
    .query(`
      INSERT INTO Accounts (Email, PasswordHash, RoleID)
      VALUES (@email, @password, @role_id)
    `)

  // Lấy thông tin account vừa tạo
  const createdAccount = await pool.request().input('email', email).query(`
      SELECT * FROM Accounts WHERE Email = @email`)

  return createdAccount.recordset[0]
}

export const login = async (email: string, password: string) => {
  const pool = await getDbPool()

  // Lấy thông tin tài khoản và role
  const result = await pool.request().input('email', email).query(`
      SELECT a.AccountID, a.Email, a.PasswordHash, r.RoleName AS role_name 
      FROM Accounts a
      JOIN Roles r ON a.RoleID = r.RoleID
      WHERE a.Email = @email
    `)

  if (result.recordset.length === 0) return null

  const user = result.recordset[0]

  // Kiểm tra mật khẩu
  const valid = await bcrypt.compare(password, user.PasswordHash)
  if (!valid) return null

  // Tạo JWT tokens
  const payload = {
    accountId: user.AccountID,
    email: user.Email,
    role: user.role_name
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = await generateRefreshToken(payload)

  return { accessToken, refreshToken, payload }
}

// Thời gian hết hạn của các token
const ACCESS_TOKEN_EXPIRES_IN = '45m'
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000 // 7 ngày

// Tạo interface cho payload của token
export interface Payload {
  accountId: number
  email: string
  role: string
}

// Tạo Access Token
export const generateAccessToken = (payload: Payload): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

// Tạo Refresh Token (Bỏ uuid, không cần nữa vì id sẽ tự động sinh trong SQL)
export const generateRefreshToken = async (payload: Payload): Promise<string> => {
  const pool = await getDbPool()

  // Tạo refresh token
  const refreshToken = jwt.sign(payload, config.jwt.secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })

  // Lấy thời gian hết hạn của refresh token
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN)

  try {
    // Thêm refresh token vào database
    await pool
      .request()
      .input('token', refreshToken)
      .input('accountId', payload.accountId)
      .input('expiresAt', expiresAt).query(`
        INSERT INTO RefreshTokens (Token, AccountID, ExpiresAt)
        VALUES (@token, @accountId, @expiresAt)
      `)
  } catch (error) {
    throw new Error('Error saving refresh token to the database')
  }

  return refreshToken
}

// Xác minh Refresh Token
export const verifyRefreshToken = async (
  token: string
): Promise<{ accountId: number; email: string; role: string } | null> => {
  const pool = await getDbPool()

  try {
    // Kiểm tra nếu token tồn tại và chưa bị thu hồi
    const result = await pool
      .request()
      .input('token', token)
      .query('SELECT TOP 1 * FROM RefreshToken WHERE token = @token AND revoked = 0')

    if (result.recordset.length === 0) return null

    const tokenRecord = result.recordset[0]

    // Kiểm tra nếu token đã hết hạn
    if (new Date(tokenRecord.expires_at) < new Date()) return null

    // Giải mã token và lấy accountId
    // const decoded = jwt.verify(token, jwtSecret) as { accountId: number }
    const decoded = jwt.verify(token, config.jwt.secret) as { accountId: number; email: string; role: string }

    // Lấy thông tin người dùng
    const userResult = await pool.request().input('accountId', decoded.accountId).query(`
        SELECT a.email, r.RoleName AS role 
        FROM Accounts a
        JOIN Roles r ON a.RoleID = r.RoleID
        WHERE a.AccountID = @accountId
      `)

    if (userResult.recordset.length === 0) return null
    const user = userResult.recordset[0]

    // Trả về thông tin đầy đủ của user
    return {
      accountId: decoded.accountId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    console.error('Error verifying refresh token:', error)
    return null
  }
}

// Thu hồi Refresh Token
export const revokeRefreshToken = async (token: string): Promise<void> => {
  const pool = await getDbPool()

  try {
    // Cập nhật trạng thái revoked của token
    await pool.request().input('token', token).query('UPDATE RefreshToken SET revoked = 1 WHERE token = @token')
  } catch (error) {
    throw new Error('Error revoking refresh token')
  }
}

export const PasswordChange = async (userId: number, password: string, newPassword: string) => {
  const pool = await getDbPool()

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
