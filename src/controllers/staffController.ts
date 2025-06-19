import { Request, Response } from 'express'
import { poolPromise } from '../config/index'
import { AuthRequest } from '../middlewares/authenticate'

// Staff xem danh sách các lịch hẹn
export const getAppointmentsForStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT * FROM TestRequest WHERE Status = 'Pending'
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
export const createTestConfirm = async (req: AuthRequest, res: Response): Promise<void> => {
  const testreqid = req.params.TestRequestId
  if (!testreqid) {
    res.status(400).json({ message: 'Missing test Request' })
  }
  try {
    const pool = await poolPromise
    const testreq = await pool
      .request()
      .input('id', parseInt(testreqid))
      .query('SELECT * FROM TestRequest WHERE TestRequestID = @id')
    const testtype = await pool
      .request()
      .input('typeid', testreq.recordset[0].TestTypeID)
      .query('SELECT * FROM TestType where id = @typeid')
    const update = await pool
      .request()
      .input('testid', testreqid)
      .input('status', 'Confirmed')
      .query('UPDATE TestRequest Set Status = @status WHERE TestRequestID = @testid')
    if (testtype.recordset[0].testName === 'Home') {
      const kitid = 'K' + String(testreq.recordset[0].TestRequestID)
      const insert = await pool
        .request()
        .input('kitid', kitid)
        .input('testreqid', testreqid)
        .input('accountId', testreq.recordset[0].CustomerID)
        .query('Insert into TestHome(kitID,TestRequestID,AccountID) VALUES (@kitid,@testreqid,@accountId)')
      res.json({ message: 'Test Process create successfully' })
    } else if (testtype.recordset[0].testName === 'Center') {
      const insert = await pool
        .request()
        .input('testreqid', testreqid)
        .input('accountId', testreq.recordset[0].CustomerID)
        .query('Insert into TestCenter(TestRequestID,AccountID) VALUES (@testreqid,@accountId)')
      res.json({ message: 'Test Process create successfully' })
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: `Error entering test result: ${error.message}` })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
export const createTestResult = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user
  const { resultdata } = req.body
  const testreqid = req.params.TestRequestID
  try {
    const pool = await poolPromise
    const sample = await pool
      .request()
      .input('testreqid', testreqid)
      .query('SELECT * FROM Sample From SampleCagories WHERE TestRequestID = @testreqid')
    const TestRequest = await pool
      .request()
      .input('id', testreqid)
      .query('SELECT * FROM TestRequest WHERE TestRequestID = @id')
    const TestType = await pool
      .request()
      .input('id', TestRequest.recordset[0].testTypeID)
      .query('SELECT * From TestType WHERE id = @id')
    if ((TestType.recordset[0].testName = 'Home')) {
      const udhome = await pool
        .request()
        .input('status', 'Results Ready')
        .input('Testreqid', testreqid)
        .query('UPDATE TestHome Set Status = @status WHERE TestTypeID = @Testreqid')
    } else if ((TestType.recordset[0].testName = 'Center')) {
      const udhome = await pool
        .request()
        .input('status', 'Results Ready')
        .input('Testreqid', testreqid)
        .query('Update TestCenter Set Status = @status WHERE TestTypeID = @Testreqid')
    }
    const add = await pool
      .request()
      .input('testrqid', testreqid)
      .input('Enterid', user?.accountId)
      .input('resultdata', resultdata)
      .input('Status', 'Pending')
      .query(
        'INSERT Into TestResults(TestRequestID, EnteredBy, ResultData, EnteredAt,Status) Values (@testrqid,@Enterid,@resultdata,GETDATE(),@Status)'
      )
    res.json(add)
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: `Error entering test result: ${error.message}` })
    } else {
      res.status(500).json({ message: 'An unknown error occurred' })
    }
  }
}
