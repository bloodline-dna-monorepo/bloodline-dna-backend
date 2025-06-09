import { Response, Request } from 'express'
import { AuthRequest } from '../middlewares/authenticate'
import { register, login } from '../services/authService'
import { PasswordChange } from '../services/passwordService'
import { verifyRefreshToken, generateAccessToken } from '../services/tokenService'
import { error } from 'console'

export const registerHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, confirmpassword } = req.body

  // Kiểm tra các tham số đầu vào
  if (!email || !password || !confirmpassword) {
    res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' })
    return
  }

  try {
    const user = await register(email, password, confirmpassword)
    if (!user) {
      res.status(409).json({ message: 'Email đã tồn tại' })
      return
    }
    res.status(201).json({ message: 'Đăng ký thành công', user })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}

export const loginHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' })
    return
  }

  try {
    const tokens = await login(email, password)
    if (!tokens) {
      res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ' })
      return
    }

    res.json(tokens)
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}

export const PasswordChangeHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  if (!user) {
    res.status(401).json({ message: 'Không có quyền truy cập' })
    return
  }

  const { password, newPassword } = req.body

  // Kiểm tra mật khẩu cũ và mật khẩu mới
  if (!password) {
    res.status(400).json({ message: 'Mật khẩu cũ là bắt buộc' })
    return
  }
  if (!newPassword) {
    res.status(400).json({ message: 'Mật khẩu mới là bắt buộc' })
    return
  }

  try {
    await PasswordChange(user.accountId, password, newPassword)
    res.json({ message: 'Yêu cầu thay đổi mật khẩu đã được gửi để phê duyệt' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}

export const refreshAccessTokenHandler = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    res.status(400).json({ message: 'Thiếu refresh token' })
    return
  }

  try {
    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' })
      return
    }

    // Đảm bảo bạn truyền đầy đủ thông tin trong payload
    const newAccessToken = generateAccessToken({
      accountId: payload.accountId,
      email: payload.email,
      role: payload.role
    })

    res.json({ accessToken: newAccessToken })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Đã xảy ra lỗi không xác định' })
    }
  }
}
