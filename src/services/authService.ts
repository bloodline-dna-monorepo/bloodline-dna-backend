import bcrypt from 'bcrypt'
import { poolPromise } from '../config'
import { generateAccessToken, generateRefreshToken } from './tokenService'
import { v4 as uuidv4 } from 'uuid'

export const register = async (email: string, password: string, confirmpassword: string) => {
  if (password !== confirmpassword) {
    throw new Error('Mật khẩu không trùng khớp')
  }
  const pool = await poolPromise

  const Result = await pool.request().input('email', email).query('SELECT email FROM Account WHERE email = @email')

  if (Result.recordset.length > 0) {
    throw new Error('Account đã tồn tại')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const name = 'Customer'
  const roleacc = await pool.request().input('name', name).query('SELECT * FROM Role WHERE name = @name')
  const role = roleacc.recordset[0]

  const newId = uuidv4()

  const insert = await pool
    .request()
    .input('id', newId)
    .input('email', email)
    .input('password', passwordHash)
    .input('role_id', role.id).query(`
      INSERT INTO Account (id, email, password, role_id)
      VALUES (@id, @email, @password, @role_id);
    `)

  return insert.recordset[0]
}

export const login = async (email: string, password: string) => {
  const pool = await poolPromise
  const result = await pool
    .request()
    .input('email', email)
    .query(
      'SELECT a.id, a.email, a.password, r.name AS role_name FROM Account a JOIN Role r ON a.role_id = r.id WHERE a.email = @email'
    )

  if (result.recordset.length === 0) return null

  const user = result.recordset[0]
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  const payload = { userId: user.id, email: user.email, role: user.role_name }
  const accessToken = generateAccessToken(payload)
  const refreshToken = await generateRefreshToken(user.id)

  return { accessToken, refreshToken }
}
