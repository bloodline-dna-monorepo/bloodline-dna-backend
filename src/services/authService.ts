import bcrypt from 'bcrypt'
import { poolPromise } from '../config'
import { generateAccessToken, generateRefreshToken } from './tokenService'

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

  const pool = await poolPromise

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
  const pool = await poolPromise

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
  const refreshToken = await generateRefreshToken(user.AccountID)

  return { accessToken, refreshToken }
}
