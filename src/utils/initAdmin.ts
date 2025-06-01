import bcrypt from 'bcrypt';
import { poolPromise, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../config';
import { v4 as uuidv4 } from 'uuid';

export async function initDefaultAdmin() {
  const pool = await poolPromise;

  const roleResult = await pool.request()
    .input('roleName', 'admin')
    .query('SELECT id FROM Role WHERE name = @roleName');

  if (roleResult.recordset.length === 0) {
    throw new Error('Role admin chưa tồn tại trong DB.');
  }

  const adminRoleId = roleResult.recordset[0].id;

  const existingAdmin = await pool.request()
    .input('email', DEFAULT_ADMIN_EMAIL)
    .query('SELECT * FROM Account WHERE email = @email');

  if (existingAdmin.recordset.length === 0) {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    const newId = uuidv4();

    await pool.request()
      .input('id', newId)
      .input('email', DEFAULT_ADMIN_EMAIL)
      .input('password', passwordHash)
      .input('role_id', adminRoleId)
      .query('INSERT INTO Account (id, email, password, role_id) VALUES (@id, @email, @password, @role_id)');

    console.log('Admin mặc định đã được tạo:', DEFAULT_ADMIN_EMAIL);
  } else {
    console.log('Admin mặc định đã tồn tại.');
  }
}
