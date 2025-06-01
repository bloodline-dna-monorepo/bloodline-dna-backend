import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { poolPromise, jwtSecret } from '../config'

interface Account {
  id: number
  email: string
  password: string
  role_id: number
  role_name: string
}

export const register = async (email: string, password: string, roleName: string): Promise<Account | null> => {
  const pool = await poolPromise

  // Kiểm tra role tồn tại, lấy role_id
  const roleResult = await pool
    .request()
    .input('roleName', roleName)
    .query('SELECT id FROM Role WHERE name = @roleName')

  if (roleResult.recordset.length === 0) {
    throw new Error('Role không tồn tại')
  }

  const roleId = roleResult.recordset[0].id

  // Kiểm tra email tồn tại
  const check = await pool.request().input('email', email).query('SELECT * FROM Account WHERE email = @email')

  if (check.recordset.length > 0) {
    return null // Email đã tồn tại
  }

  // Hash mật khẩu
  const passwordHash = await bcrypt.hash(password, 10)

  // Insert vào Account
  const insertResult = await pool
    .request()
    .input('email', email)
    .input('password', passwordHash)
    .input('role_id', roleId).query(`
      INSERT INTO Account (email, password, role_id)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.password, INSERTED.role_id
      VALUES (@email, @password, @role_id)
    `)

  return insertResult.recordset[0] as Account
}

export const login = async (
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string } | null> => {
  const pool = await poolPromise

  // Lấy tài khoản và tên role qua join
  const result = await pool.request().input('email', email).query(`
      SELECT a.id, a.email, a.password, r.name AS role_name
      FROM Account a
      JOIN Role r ON a.role_id = r.id
      WHERE a.email = @email
    `)

  if (result.recordset.length === 0) return null

  const user = result.recordset[0] as Account

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  const payload = { userId: user.id, email: user.email, role: user.role_name }
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET_ACCESS_TOKEN as string, { expiresIn: '1h' })
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH_TOKEN as string, { expiresIn: '1h' })

  return { accessToken, refreshToken }
}
