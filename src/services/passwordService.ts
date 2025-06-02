import bcrypt from 'bcrypt'
import { poolPromise } from '../config'
import { v4 as uuidv4 } from 'uuid'

export const PasswordChange = async (userId: string, password: string, newPassword: string) => {
  const pool = await poolPromise
  const Result = await pool
    .request()
    .input('userId', userId)
    .query('SELECT password FROM Account WHERE userId = @userId')
  if (Result.recordset.length === 0) {
    throw new Error('Account not found')
  }
  const user = Result.recordset[0]
  const Match = bcrypt.compare(password, user.password)
  if (!Match) {
    throw new Error('Old password is wrong')
  }
  const newhash = await bcrypt.hash(newPassword, 10)
  await pool
    .request()
    .input('userId', userId)
    .input('newPasswordHash', newhash)
    .query('UPDATE FROM Account SET password = @newPasswordHash WHERE email = @email')
  return { message: 'Change is successful' }
}
