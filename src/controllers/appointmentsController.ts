import { Request, Response } from 'express'
import { poolPromise } from '../config/index'
import { AuthRequest } from '../middlewares/authenticate'

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  console.log('✅ User from token:', user)

  if (!user) {
    res.status(401).json({ message: 'Không có quyền truy cập' })
    return
  }
  const { serviceId, scheduleDate, testType, address } = req.body

  try {
    const pool = await poolPromise
    const test = await pool.request().input('Name', testType).query(`SELECT * from TestType WHERE testName = @Name`)
    if (test.recordset.length === 0) {
      throw new Error('Testtype ko hop ly')
    }
    const type = test.recordset[0]
    const result = await pool
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
    res.status(201).json({ message: 'Appointment created successfully', appointmentId })
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
        INSERT INTO Payments (AppointmentID, Amount, PaymentMethod, PaidAt)
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
