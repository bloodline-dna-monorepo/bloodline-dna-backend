import jwt from 'jsonwebtoken';
import { poolPromise, jwtSecret } from '../config';

// Thời gian hết hạn của các token
const ACCESS_TOKEN_EXPIRES_IN = '1000s';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 ngày

// Tạo interface cho payload của token
export interface Payload {
  accountId: string;
  email: string;
  role: string;
}

// Tạo Access Token
export const generateAccessToken = (payload: Payload): string => {
  return jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

// Tạo Refresh Token (Bỏ uuid, không cần nữa vì id sẽ tự động sinh trong SQL)
export const generateRefreshToken = async (accountId: string): Promise<string> => {
  const pool = await poolPromise;
  
  // Tạo refresh token
  const refreshToken = jwt.sign({ accountId }, jwtSecret, { expiresIn: '7d' });

  // Lấy thời gian hết hạn của refresh token
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN);

  try {
    // Thêm refresh token vào database
    await pool
      .request()
      .input('token', refreshToken)
      .input('accountId', accountId)
      .input('expiresAt', expiresAt)
      .query(`
        INSERT INTO RefreshToken (token, account_id, expires_at)
        VALUES (@token, @accountId, @expiresAt)
      `);
  } catch (error) {
    throw new Error('Error saving refresh token to the database');
  }

  return refreshToken;
};

// Xác minh Refresh Token
export const verifyRefreshToken = async (
  token: string
): Promise<{ accountId: string; email: string; role: string } | null> => {
  const pool = await poolPromise;

  try {
    // Kiểm tra nếu token tồn tại và chưa bị thu hồi
    const result = await pool
      .request()
      .input('token', token)
      .query('SELECT TOP 1 * FROM RefreshToken WHERE token = @token AND revoked = 0');

    if (result.recordset.length === 0) return null;

    const tokenRecord = result.recordset[0];

    // Kiểm tra nếu token đã hết hạn
    if (new Date(tokenRecord.expires_at) < new Date()) return null;

    // Giải mã token và lấy accountId
    const decoded = jwt.verify(token, jwtSecret) as { accountId: string };

    // Lấy thông tin người dùng
    const userResult = await pool
      .request()
      .input('accountId', decoded.accountId)
      .query(`
        SELECT a.email, r.RoleName AS role 
        FROM Accounts a
        JOIN Roles r ON a.RoleID = r.RoleID
        WHERE a.AccountID = @accountId
      `);

    if (userResult.recordset.length === 0) return null;
    const user = userResult.recordset[0];

    // Trả về thông tin đầy đủ của user
    return {
      accountId: decoded.accountId,
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
};

// Thu hồi Refresh Token
export const revokeRefreshToken = async (token: string): Promise<void> => {
  const pool = await poolPromise;

  try {
    // Cập nhật trạng thái revoked của token
    await pool.request().input('token', token).query('UPDATE RefreshToken SET revoked = 1 WHERE token = @token');
  } catch (error) {
    throw new Error('Error revoking refresh token');
  }
};
