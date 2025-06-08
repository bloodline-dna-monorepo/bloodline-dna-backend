import { Request, Response } from 'express'
import { poolPromise } from '../config/index'

export const createAppointment = async (req: Request, res: Response) => {
  const { customerId, serviceId, scheduleDate, locationType, address, numTestSubjects } = req.body

  try {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input('customerId', customerId)
      .input('serviceId', serviceId)
      .input('scheduleDate', scheduleDate)
      .input('locationType', locationType)
      .input('address', address)
      .input('numTestSubjects', numTestSubjects).query(`
        INSERT INTO Appointments (CustomerID, ServiceID, ScheduleDate, LocationType, Address, NumTestSubjects)
        VALUES (@customerId, @serviceId, @scheduleDate, @locationType, @address, @numTestSubjects)
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
