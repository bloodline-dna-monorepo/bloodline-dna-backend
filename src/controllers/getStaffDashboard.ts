import type { Request, Response } from 'express'
import type { AuthRequest } from '../middlewares/authenticate'
import { poolPromise } from '../config'
import { KitService } from '../services/kitService'

export const getStaffDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = await poolPromise

    // Get paid test requests that need staff attention
    const result = await pool.request().query(`
      SELECT tr.TestRequestID, tr.ScheduleDate, tr.Address, tr.Status, tr.CreatedAt,
             s.ServiceName, tt.testName as TestType, up.FullName as CustomerName,
             p.Amount, p.PaymentStatus
      FROM TestRequest tr
      JOIN Services s ON tr.ServiceID = s.ServiceID
      JOIN TestType tt ON tr.TestTypeID = tt.id
      JOIN Accounts a ON tr.CustomerID = a.AccountID
      LEFT JOIN UserProfiles up ON a.AccountID = up.AccountID
      LEFT JOIN Payments p ON tr.TestRequestID = p.TestRequestID
      WHERE p.PaymentStatus = 'Completed' AND tr.Status IN ('Paid', 'Kit_Sent', 'Sample_Received', 'In_Testing')
      ORDER BY tr.CreatedAt DESC
    `)

    res.json({ success: true, testRequests: result.recordset })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

export const assignKit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testRequestId } = req.body
    const user = req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const kitId = await KitService.assignKitToTestRequest(testRequestId, user.accountId)
    res.json({ success: true, kitId, message: 'Kit assigned successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

export const updateTestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { testRequestId, status, notes } = req.body
    const user = req.user

    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const pool = await poolPromise

    // Update test request status
    await pool.request().input('testRequestId', testRequestId).input('status', status).query(`
        UPDATE TestRequest SET Status = @status WHERE TestRequestID = @testRequestId
      `)

    // Log status change
    await pool
      .request()
      .input('testRequestId', testRequestId)
      .input('status', status)
      .input('updatedBy', user.accountId)
      .input('notes', notes || '').query(`
        INSERT INTO TestRequestStatus (TestRequestID, Status, UpdatedBy, Notes)
        VALUES (@testRequestId, @status, @updatedBy, @notes)
      `)

    res.json({ success: true, message: 'Status updated successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
