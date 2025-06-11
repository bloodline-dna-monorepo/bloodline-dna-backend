import type { Response } from 'express'
import { poolPromise } from '../config/index'
import type { AuthRequest } from '../middlewares/authenticate'

// Get customer profile
export const getCustomerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const pool = await poolPromise
    const result = await pool.request().input('accountId', user.accountId).query(`
        SELECT a.AccountID as accountId, a.Email as email, r.RoleName as role, 
               up.FullName as fullName, up.Address as address, up.DateOfBirth as dateOfBirth
        FROM Accounts a
        LEFT JOIN UserProfiles up ON a.AccountID = up.AccountID
        JOIN Roles r ON a.RoleID = r.RoleID
        WHERE a.AccountID = @accountId
      `)

    if (result.recordset.length === 0) {
      res.status(404).json({ message: 'User profile not found' })
      return
    }

    res.json(result.recordset[0])
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

// Update customer profile
export const updateCustomerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const { fullName, address, dateOfBirth } = req.body

    const pool = await poolPromise

    // Check if profile exists
    const checkResult = await pool.request().input('accountId', user.accountId).query(`
        SELECT * FROM UserProfiles WHERE AccountID = @accountId
      `)

    if (checkResult.recordset.length === 0) {
      // Create new profile
      await pool
        .request()
        .input('accountId', user.accountId)
        .input('fullName', fullName)
        .input('email', user.email)
        .input('address', address)
        .input('dateOfBirth', dateOfBirth).query(`
          INSERT INTO UserProfiles (AccountID, FullName, Email, Address, DateOfBirth)
          VALUES (@accountId, @fullName, @email, @address, @dateOfBirth)
        `)
    } else {
      // Update existing profile
      await pool
        .request()
        .input('accountId', user.accountId)
        .input('fullName', fullName)
        .input('address', address)
        .input('dateOfBirth', dateOfBirth).query(`
          UPDATE UserProfiles
          SET FullName = @fullName, Address = @address, DateOfBirth = @dateOfBirth, UpdatedAt = GETDATE()
          WHERE AccountID = @accountId
        `)
    }

    res.json({ message: 'Profile updated successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

// Get customer appointments
export const getCustomerAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const pool = await poolPromise
    const result = await pool.request().input('customerId', user.accountId).query(`
        SELECT tr.TestRequestID, tr.ScheduleDate, tr.Address, tr.Status, tr.CreatedAt,
               s.ServiceName, s.Description, tt.testName as TestType,
               p.Amount as PaymentAmount, p.PaymentMethod, p.PaidAt
        FROM TestRequest tr
        JOIN Services s ON tr.ServiceID = s.ServiceID
        JOIN TestType tt ON tr.TestTypeID = tt.id
        LEFT JOIN Payments p ON tr.TestRequestID = p.TestRequestID
        WHERE tr.CustomerID = @customerId
        ORDER BY tr.CreatedAt DESC
      `)

    res.json(result.recordset)
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

// Get appointment details
export const getAppointmentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const { appointmentId } = req.params

    const pool = await poolPromise

    // Get appointment details
    const appointmentResult = await pool
      .request()
      .input('appointmentId', appointmentId)
      .input('customerId', user.accountId).query(`
        SELECT tr.TestRequestID, tr.ScheduleDate, tr.Address, tr.Status, tr.CreatedAt,
               s.ServiceName, s.Description, tt.testName as TestType,
               p.Amount as PaymentAmount, p.PaymentMethod, p.PaidAt
        FROM TestRequest tr
        JOIN Services s ON tr.ServiceID = s.ServiceID
        JOIN TestType tt ON tr.TestTypeID = tt.id
        LEFT JOIN Payments p ON tr.TestRequestID = p.TestRequestID
        WHERE tr.TestRequestID = @appointmentId AND tr.CustomerID = @customerId
      `)

    if (appointmentResult.recordset.length === 0) {
      res.status(404).json({ message: 'Appointment not found' })
      return
    }

    const appointment = appointmentResult.recordset[0]

    // Get sample categories
    const samplesResult = await pool.request().input('testRequestId', appointmentId).query(`
        SELECT SampleID, sampleType, ownerName, gender, relationship, yob
        FROM SampleCategories
        WHERE TestRequestID = @testRequestId
      `)

    // Get test results if available
    const resultsResult = await pool.request().input('testRequestId', appointmentId).query(`
        SELECT ResultID, ResultData, EnteredAt, VerifiedAt, Status
        FROM TestResults
        WHERE TestRequestID = @testRequestId
      `)

    res.json({
      appointment,
      samples: samplesResult.recordset,
      results: resultsResult.recordset.length > 0 ? resultsResult.recordset[0] : null
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
