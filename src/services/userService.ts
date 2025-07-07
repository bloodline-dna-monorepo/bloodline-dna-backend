import { getDbPool } from '../config/database'

import type { UserProfile } from '../types/type'

export const userService = {
  // Get user profile by account ID
  getUserProfile: async (accountId: number | undefined): Promise<UserProfile | null> => {
    try {
      const pool = await getDbPool()
      const result = await pool.request().input('accountId', accountId).query(`
          SELECT up.*, a.Email as AccountEmail
          FROM UserProfiles up
          JOIN Accounts a ON up.AccountID = a.AccountID
          WHERE up.AccountID = @accountId
        `)

      if (result.recordset.length === 0) {
        return null
      }

      const profile = result.recordset[0]
      return profile
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  },

  // Update user profile
  updateUserProfile: async (accountId: number | undefined, updateData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const pool = await getDbPool()

      const { FullName, PhoneNumber, Address, DateOfBirth } = updateData

      // Build dynamic update query

      const request = pool
        .request()
        .input('accountId', accountId)

        .input('fullName', FullName)

        .input('phoneNumber', PhoneNumber)

        .input('address', Address)
        .input('dateOfBirth', DateOfBirth)

      await request.query(`
          UPDATE UserProfiles 
          SET Fullname = @fullname, Address =@address, PhoneNumber = @phonenumber, DateOfBirth = @dateOfBirth
          WHERE AccountID = @accountId
        `)
      // Return updated profile
      const updatedProfile = await userService.getUserProfile(accountId)
      return updatedProfile!
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  // Update signature
  updateSignature: async (accountId: number, signaturePath: string): Promise<void> => {
    try {
      const pool = await getDbPool()
      await pool.request().input('accountId', accountId).input('signaturePath', signaturePath).query(`
          UPDATE UserProfiles 
          SET SignatureImage = @signaturePath, UpdatedAt = GETDATE()
          WHERE AccountID = @accountId
        `)
    } catch (error) {
      console.error('Error updating signature:', error)
      throw error
    }
  },

  // Get all users with pagination (Admin only)
  getAllUsers: async (email: string | undefined): Promise<any[]> => {
    try {
      const pool = await getDbPool()

      // Get total count
      // Get users with pagination
      const result = await pool.request().input('email', email).query(`
          SELECT 
            a.AccountID,
            a.Email,
            a.RoleID,
            a.CreatedAt,
            up.FullName,
            up.PhoneNumber,
            up.Address,
            up.DateOfBirth
          FROM Accounts a
          LEFT JOIN UserProfiles up ON a.AccountID = up.AccountID
          where a.Email like @email
        `)
      return result.recordset
    } catch (error) {
      console.error('Error getting all users:', error)
      throw error
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (email: string, roleId: number): Promise<void> => {
    try {
      const pool = await getDbPool()
      await pool
        .request()
        .input('email', email)
        .input('roleId', roleId)
        .query('UPDATE Accounts SET RoleID = @roleId WHERE Email = @email')
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  },

  // Toggle user status (Admin only)
  toggleUserStatus: async (userId: number): Promise<void> => {
    try {
      const pool = await getDbPool()
      // Note: This assumes you have an IsActive column in Accounts table
      // If not, you might need to add this column or implement differently
      await pool.request().input('userId', userId).query(`
          UPDATE Accounts 
          SET IsActive = CASE WHEN IsActive = 1 THEN 0 ELSE 1 END
          WHERE AccountID = @userId
        `)
    } catch (error) {
      console.error('Error toggling user status:', error)
      throw error
    }
  }
}
