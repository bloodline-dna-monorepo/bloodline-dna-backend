import bcrypt from 'bcrypt';
import { poolPromise } from '../config';
import { generateAccessToken, generateRefreshToken } from './tokenService';
import { v4 as uuidv4 } from 'uuid';

export const register = async (email: string, password: string, roleName: string) => {
  const pool = await poolPromise;

  const roleResult = await pool.request()
    .input('roleName', roleName)
    .query('SELECT id FROM Role WHERE name = @roleName');

  if (roleResult.recordset.length === 0) {
    throw new Error('Role không tồn tại');
  }
  const roleId = roleResult.recordset[0].id;

  const check = await pool.request()
    .input('email', email)
    .query('SELECT * FROM Account WHERE email = @email');

  if (check.recordset.length > 0) return null;

  const passwordHash = await bcrypt.hash(password, 10);
  const newId = uuidv4();

  const insert = await pool.request()
    .input('id', newId)
    .input('email', email)
    .input('password', passwordHash)
    .input('role_id', roleId)
    .query(`
      INSERT INTO Account (id, email, password, role_id)
      VALUES (@id, @email, @password, @role_id);

      SELECT id, email, role_id FROM Account WHERE id = @id;
    `);

  return insert.recordset[0];
};

export const login = async (email: string, password: string) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('email', email)
    .query('SELECT a.id, a.email, a.password, r.name AS role_name FROM Account a JOIN Role r ON a.role_id = r.id WHERE a.email = @email');

  if (result.recordset.length === 0) return null;

  const user = result.recordset[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  const payload = { userId: user.id, email: user.email, role: user.role_name };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken };
};
