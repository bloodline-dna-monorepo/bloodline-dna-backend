import jwt from 'jsonwebtoken'
import { poolPromise, jwtSecret } from '../config'
import { v4 as uuidv4 } from 'uuid'

const ACCESS_TOKEN_EXPIRES_IN = '20s'
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000

export const generateAccessToken = (payload: object): string => {
  return jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN })
}

export const generateRefreshToken = async (accountId: string): Promise<string> => {
  const pool = await poolPromise
  const refreshToken = jwt.sign({ accountId }, jwtSecret, { expiresIn: '7d' })
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN)
  const id = uuidv4()

  await pool
    .request()
    .input('id', id)
    .input('token', refreshToken)
    .input('accountId', accountId)
    .input('expiresAt', expiresAt)
    .query('INSERT INTO RefreshToken (id, token, account_id, expires_at) VALUES (@id, @token, @accountId, @expiresAt)')

  return refreshToken
}

export const verifyRefreshToken = async (token: string): Promise<{ accountId: string } | null> => {
  const pool = await poolPromise
  const result = await pool
    .request()
    .input('token', token)
    .query('SELECT * FROM RefreshToken WHERE token = @token AND revoked = 0')

  if (result.recordset.length === 0) return null
  const tokenRecord = result.recordset[0]

  if (new Date(tokenRecord.expires_at) < new Date()) return null

  try {
    const payload = jwt.verify(token, jwtSecret) as { accountId: string }
    return payload
  } catch {
    return null
  }
}

export const revokeRefreshToken = async (token: string): Promise<void> => {
  const pool = await poolPromise
  await pool.request().input('token', token).query('UPDATE RefreshToken SET revoked = 1 WHERE token = @token')
}
