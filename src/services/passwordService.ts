import bcrypt from 'bcrypt';
import { poolPromise } from '../config';
import { v4 as uuidv4 } from 'uuid';

export const requestPasswordChange = async (accountId: string, newPassword: string) => {
  const pool = await poolPromise;
  const newHash = await bcrypt.hash(newPassword, 10);
  const id = uuidv4();

  await pool.request()
    .input('id', id)
    .input('accountId', accountId)
    .input('newPasswordHash', newHash)
    .query('INSERT INTO PasswordChangeRequest (id, account_id, new_password_hash) VALUES (@id, @accountId, @newPasswordHash)');
};

export const listPasswordChangeRequests = async () => {
  const pool = await poolPromise;
  const result = await pool.request()
    .query('SELECT r.id, a.email, r.status, r.requested_at FROM PasswordChangeRequest r JOIN Account a ON r.account_id = a.id WHERE r.status = \'pending\'');
  return result.recordset;
};

export const reviewPasswordChangeRequest = async (requestId: string, action: 'approve' | 'reject', adminId: string) => {
  const pool = await poolPromise;

  const requestResult = await pool.request()
    .input('id', requestId)
    .query('SELECT * FROM PasswordChangeRequest WHERE id = @id');

  if (requestResult.recordset.length === 0) {
    throw new Error('Request not found');
  }

  const request = requestResult.recordset[0];
  if (request.status !== 'pending') {
    throw new Error('Request already reviewed');
  }

  if (action === 'approve') {
    await pool.request()
      .input('password', request.new_password_hash)
      .input('accountId', request.account_id)
      .query('UPDATE Account SET password = @password WHERE id = @accountId');
  }

  await pool.request()
    .input('id', requestId)
    .input('status', action === 'approve' ? 'approved' : 'rejected')
    .input('reviewedBy', adminId)
    .input('reviewedAt', new Date())
    .query('UPDATE PasswordChangeRequest SET status = @status, reviewed_by = @reviewedBy, reviewed_at = @reviewedAt WHERE id = @id');
};
