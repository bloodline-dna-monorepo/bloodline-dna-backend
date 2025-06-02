import { Response ,Request} from 'express';
import { AuthRequest } from '../middlewares/authenticate';
import { register, login } from '../services/authService';
import { requestPasswordChange, listPasswordChangeRequests, reviewPasswordChangeRequest } from '../services/passwordService';
import { verifyRefreshToken, generateAccessToken } from '../services/tokenService';

export const registerHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    res.status(400).json({ message: 'Missing email, password or role' });
    return;
  }

  const validRoles: string[] = ['admin', 'manager', 'staff', 'customer'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }

  try {
    const user = await register(email, password, role);
    if (!user) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }
    res.status(201).json({ message: 'User registered', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const loginHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Missing email or password' });
    return;
  }

  const tokens = await login(email, password);
  if (!tokens) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  res.json(tokens);
};

export const requestPasswordChangeHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400).json({ message: 'New password is required' });
    return;
  }

  await requestPasswordChange(user.userId, newPassword);
  res.json({ message: 'Password change request submitted for admin approval' });
};

export const listPasswordChangeRequestsHandler = async (_req: AuthRequest, res: Response): Promise<void> => {
  const requests = await listPasswordChangeRequests();
  res.json(requests);
};

export const reviewPasswordChangeRequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const adminUser = req.user;
  if (!adminUser) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { requestId, action } = req.body;

  if (!requestId || !action) {
    res.status(400).json({ message: 'requestId and action are required' });
    return;
  }

  if (!['approve', 'reject'].includes(action)) {
    res.status(400).json({ message: 'Invalid action' });
    return;
  }

  try {
    await reviewPasswordChangeRequest(requestId, action, adminUser.userId);
    res.json({ message: `Request ${action}d successfully` });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshAccessTokenHandler = async (req: Request, res: Response) : Promise<void>=> {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ message: 'Missing refresh token' });
    return 
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
    return 
  }

  const newAccessToken = generateAccessToken({ accountId: payload.accountId });

  res.json({ accessToken: newAccessToken });
};