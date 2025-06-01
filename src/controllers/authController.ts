import { Request, Response } from 'express'
import { register, login } from '../services/authService'
export const registerHandler = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body

  if (!email || !password || !role) {
    res.status(400).json({ message: 'truyền dữ liệu vào đi thằng lồn ơi' })
    return
  }

  const validRoles = ['admin', 'manager', 'staff', 'customer']
  if (!validRoles.includes(role)) {
    res.status(400).json({ message: 'Invalid role' })
    return
  }

  try {
    const user = await register(email, password, role)

    if (!user) {
      res.status(409).json({ message: 'Email already exists' })
      return
    }

    // đăng ký thành công
    res.status(201).json({ message: 'User registered', user: { id: user.id, email: user.email, role } })
    return
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error' })
    return
  }
}

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Missing email or password' })
    return
  }

  const token = await login(email, password)
  if (!token) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }
  res.json({ token })
  return
}
