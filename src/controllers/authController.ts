import { Response, Request } from 'express'
import { AuthRequest } from '../middlewares/authenticate'
import { register, login } from '../services/authService'
import { PasswordChange } from '../services/passwordService'
import { verifyRefreshToken, generateAccessToken } from '../services/tokenService'
import { json } from 'stream/consumers'

export const registerHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, confirmpassword } = req.body

  if (!email || !password || !confirmpassword) {
    res.status(400).json({ message: 'Missing email or password' })
    return
  }

  try {
    const user = await register(email, password, confirmpassword)
    if (!user) {
      res.status(409).json({ message: 'Email already exists' })
      return
    }
    res.status(201).json({ message: 'User registered', user })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export const loginHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Missing email or password' })
    return
  }

  const tokens = await login(email, password)
  if (!tokens) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  res.json(tokens)
}

export const PasswordChangeHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
  const { password, newPassword } = req.body

  if (!password) {
    res.status(400).json({ message: 'Old password is required' })
  }
  if (!newPassword) {
    res.status(400).json({ message: 'New password is required' })
    return
  }

  await PasswordChange(user.userId, password, newPassword)
  res.json({ message: 'Password change request submitted for admin approval' })
}

export const refreshAccessTokenHandler = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    res.status(400).json({ message: 'Missing refresh token' })
    return
  }

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload) {
    res.status(401).json({ message: 'Invalid or expired refresh token' })
    return
  }

  const newAccessToken = generateAccessToken({ accountId: payload.accountId })

  res.json({ accessToken: newAccessToken })
}
