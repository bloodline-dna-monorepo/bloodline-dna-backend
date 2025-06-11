import sql from 'mssql'
import config from '../config'

export class ApiService {
  static async updateAppointmentPaymentStatus(appointmentId: number, paymentData: any) {
    try {
      const pool = await sql.connect(config.dbConfig)

      await pool
        .request()
        .input('appointmentId', sql.Int, appointmentId)
        .input('status', sql.NVarChar, paymentData.status)
        .input('paymentStatus', sql.NVarChar, paymentData.paymentStatus)
        .input('transactionId', sql.NVarChar, paymentData.transactionId)
        .input('paymentDate', sql.DateTime, paymentData.paymentDate).query(`
          UPDATE Appointments 
          SET Status = @status, 
              PaymentStatus = @paymentStatus,
              TransactionId = @transactionId,
              PaymentDate = @paymentDate,
              UpdatedAt = GETDATE()
          WHERE AppointmentID = @appointmentId
        `)

      return { success: true }
    } catch (error) {
      console.error('Update payment status error:', error)
      throw error
    }
  }

  static async getAppointmentsForStaff(filters: any) {
    try {
      const pool = await sql.connect(config.dbConfig)

      let query = `
        SELECT a.*, u.FullName as CustomerName, s.ServiceName
        FROM Appointments a
        JOIN Users u ON a.CustomerID = u.UserID
        JOIN Services s ON a.ServiceID = s.ServiceID
        WHERE a.PaymentStatus = 'Paid'
      `

      if (filters.status) {
        query += ` AND a.Status = '${filters.status}'`
      }

      query += ` ORDER BY a.CreatedAt DESC`

      const result = await pool.request().query(query)
      return result.recordset
    } catch (error) {
      console.error('Get appointments for staff error:', error)
      throw error
    }
  }

  static async updateAppointmentStatus(appointmentId: number, updateData: any) {
    try {
      const pool = await sql.connect(config.dbConfig)

      await pool
        .request()
        .input('appointmentId', sql.Int, appointmentId)
        .input('status', sql.NVarChar, updateData.status)
        .input('kitId', sql.NVarChar, updateData.kitId)
        .input('notes', sql.NVarChar, updateData.notes)
        .input('updatedBy', sql.Int, updateData.updatedBy).query(`
          UPDATE Appointments 
          SET Status = @status,
              KitID = @kitId,
              Notes = @notes,
              UpdatedBy = @updatedBy,
              UpdatedAt = GETDATE()
          WHERE AppointmentID = @appointmentId
        `)

      return { success: true }
    } catch (error) {
      console.error('Update appointment status error:', error)
      throw error
    }
  }

  static async submitTestResult(appointmentId: number, resultData: any) {
    try {
      const pool = await sql.connect(config.dbConfig)

      await pool
        .request()
        .input('appointmentId', sql.Int, appointmentId)
        .input('result', sql.NVarChar, resultData.result)
        .input('notes', sql.NVarChar, resultData.notes)
        .input('images', sql.NVarChar, JSON.stringify(resultData.images))
        .input('submittedBy', sql.Int, resultData.submittedBy).query(`
          UPDATE Appointments 
          SET TestResult = @result,
              ResultNotes = @notes,
              ResultImages = @images,
              Status = 'Completed',
              ResultSubmittedBy = @submittedBy,
              ResultSubmittedAt = GETDATE(),
              UpdatedAt = GETDATE()
          WHERE AppointmentID = @appointmentId
        `)

      return { success: true }
    } catch (error) {
      console.error('Submit test result error:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
