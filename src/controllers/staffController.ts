import { Request, Response } from 'express'
import { poolPromise } from '../config/index'
import { AuthRequest } from '~/type'

// Staff xem danh sách các lịch hẹn
export const getAppointmentsForStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT * FROM TestRequest
    `)

    // Kiểm tra xem có lịch hẹn nào không
    if (result.recordset.length === 0) {
      res.status(404).json({ message: 'No TestRequest found' })
      return
    }

    res.json(result.recordset)
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: `Error fetching appointments: ${error.message}` })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

// Cập nhật trạng thái mẫu
export const updateSampleStatus = async (req: Request, res: Response): Promise<void> => {
  const { kitId, status } = req.body

  // Kiểm tra tham số đầu vào
  if (!kitId || !status) {
    res.status(400).json({ message: 'Missing kitId or status' })
    return
  }

  try {
    const pool = await poolPromise
    const result = await pool.request().input('kitId', kitId).input('status', status).query(`
      UPDATE Kits
      SET SampleStatus = @status
      WHERE KitID = @kitId
    `)

    // Kiểm tra nếu không có bản ghi nào bị ảnh hưởng
    if (result.rowsAffected[0] === 0) {
      res.status(404).json({ message: 'Kit not found' })
      return
    }

    res.json({ message: 'Sample status updated successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: `Error updating sample status: ${error.message}` })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}

// Nhập kết quả xét nghiệm
export const enterTestResult = async (req: Request, res: Response): Promise<void> => {
  const { appointmentId, resultData, staffId } = req.body

  // Kiểm tra tham số đầu vào
  if (!appointmentId || !resultData || !staffId) {
    res.status(400).json({ message: 'Missing appointmentId, resultData or staffId' })
    return
  }

  try {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input('appointmentId', appointmentId)
      .input('resultData', resultData)
      .input('staffId', staffId).query(`
        INSERT INTO TestResults (AppointmentID, ResultData, EnteredBy)
        VALUES (@appointmentId, @resultData, @staffId)
      `)

    res.json({ message: 'Test result entered successfully' })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: `Error entering test result: ${error.message}` })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
// export const createtestprocess = async (req:AuthRequest,res:Response): Promise<void> =>{
//   const {}
// }
