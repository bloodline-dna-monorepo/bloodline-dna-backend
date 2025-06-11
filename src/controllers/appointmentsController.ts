import type { Request, Response } from 'express'
import { poolPromise } from '../config/index'
import type { AuthRequest } from '../middlewares/authenticate'

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  console.log('✅ User from token:', user)

  if (!user) {
    res.status(401).json({ message: 'Không có quyền truy cập' })
    return
  }
  const { serviceId, scheduleDate, testType, address, sampleCategories } = req.body

  try {
    const pool = await poolPromise
    const test = await pool.request().input('Name', testType).query(`SELECT * from TestType WHERE testName = @Name`)
    if (test.recordset.length === 0) {
      throw new Error('Testtype ko hop ly')
    }
    const type = test.recordset[0]

    // Start a transaction
    const transaction = pool.transaction()
    await transaction.begin()

    try {
      // Insert test request
      const result = await transaction
        .request()
        .input('customerId', req.user?.accountId)
        .input('serviceId', serviceId)
        .input('scheduleDate', scheduleDate)
        .input('testTypeID', type.id)
        .input('address', address).query(`
          INSERT INTO TestRequest (CustomerID, ServiceID, ScheduleDate, testTypeID, Address)
          VALUES (@customerId, @serviceId, @scheduleDate, @testTypeID, @address)
          SELECT SCOPE_IDENTITY() AS AppointmentID
        `)

      const appointmentId = result.recordset[0].AppointmentID

      // Insert sample categories if provided
      if (sampleCategories && Array.isArray(sampleCategories)) {
        for (const sample of sampleCategories) {
          await transaction
            .request()
            .input('testRequestId', appointmentId)
            .input('sampleType', sample.sampleType)
            .input('ownerName', sample.ownerName)
            .input('gender', sample.gender)
            .input('relationship', sample.relationship)
            .input('yob', sample.yob).query(`
              INSERT INTO SampleCategories (TestRequestID, sampleType, ownerName, gender, relationship, yob)
              VALUES (@testRequestId, @sampleType, @ownerName, @gender, @relationship, @yob)
            `)
        }
      }

      // Commit the transaction
      await transaction.commit()

      res.status(201).json({ message: 'Appointment created successfully', appointmentId })
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback()
      throw error
    }
  } catch (error: unknown) {
    // Đổi kiểu error thành 'unknown'
    if (error instanceof Error) {
      // Kiểm tra nếu error là một instance của Error
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

export const getAppointmentPrice = async (req: Request, res: Response) => {
  const { serviceId } = req.params

  try {
    const pool = await poolPromise
    const result = await pool.request().input('serviceId', serviceId).query(`
        SELECT Price2Samples, Price3Samples, TimeToResult 
        FROM PriceDetails 
        WHERE ServiceID = @serviceId
      `)

    const price = result.recordset[0]
    res.json(price)
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

export const processPayment = async (req: Request, res: Response) => {
  const { appointmentId, amount, paymentMethod, paidAt } = req.body

  try {
    const pool = await poolPromise
    await pool
      .request()
      .input('appointmentId', appointmentId)
      .input('amount', amount)
      .input('paymentMethod', paymentMethod)
      .input('paidAt', paidAt).query(`
        INSERT INTO Payments (TestRequestID, Amount, PaymentMethod, PaidAt)
        VALUES (@appointmentId, @amount, @paymentMethod, @paidAt)
      `)

    res.json({ message: 'Payment successful' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

// Add endpoint to get all services
export const getAllServices = async (req: Request, res: Response) => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT s.ServiceID, s.ServiceName, s.Description, s.Category, 
             p.Price2Samples, p.Price3Samples, p.TimeToResult
      FROM Services s
      JOIN PriceDetails p ON s.ServiceID = p.ServiceID
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
