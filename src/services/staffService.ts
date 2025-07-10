import { getDbPool } from '../config/database'

interface StaffDashboardStats {
  totalRequests: number
  pendingRequests: number
  completedRequests: number
  totalCustomers: number
  completionRate: number
}

interface TestRequestDetail {
  TestRequestID: number
  AccountID: number
  ServiceID: number
  CollectionMethod: string
  Appointment: string | null
  Status: string
  CreatedAt: string
  UpdatedAt: string
  AssignedTo: number | null
  ServiceName: string
  ServiceType: string
  Price: number
  SampleCount: number
  CustomerName: string
  CustomerEmail: string
  CustomerPhone: string | null
  CustomerAddress: string | null
  TestSubjects: string
  KitID: string | null
  StaffName: string | null
}

interface SampleDetail {
  SampleCategoryID: number
  TestRequestID: number
  TesterName: string
  CMND: string
  YOB: number
  Gender: string
  Relationship: string
  SampleType: string
  Status: string
  SignatureImage: string | null
}

interface TestRequestFullDetail extends TestRequestDetail {
  samples: SampleDetail[]
  paymentInfo?: {
    amount: number
    paymentDate: string
    paymentMethod: string
  }
}

interface RecentRequest {
  TestRequestID: number
  CustomerName: string
  Status: string
  CreatedAt: string
}

class StaffService {
  async getDashboardStats(staffId: number): Promise<StaffDashboardStats> {
    const connection = await getDbPool()

    // Get total requests assigned to staff
    const totalResult = await connection.request().input('staffId', staffId).query(`
        SELECT COUNT(*) as total
        FROM TestRequests 
        WHERE AssignedTo = @staffId
      `)

    // Get pending requests (In Progress and Pending Review)
    const pendingResult = await connection.request().input('staffId', staffId).query(`
        SELECT COUNT(*) as pending
        FROM TestRequests 
        WHERE AssignedTo = @staffId AND Status IN ('Confirmed', 'In Progress', 'Pending')
      `)

    // Get completed requests (Verified)
    const completedResult = await connection.request().input('staffId', staffId).query(`
        SELECT COUNT(*) as completed
        FROM TestRequests 
        WHERE AssignedTo = @staffId AND Status = 'Verified'
      `)

    // Get total unique customers
    const customersResult = await connection.request().input('staffId', staffId).query(`
        SELECT COUNT(DISTINCT AccountID) as customers
        FROM TestRequests 
        WHERE AssignedTo = @staffId
      `)

    const total = totalResult.recordset[0].total
    const pending = pendingResult.recordset[0].pending
    const completed = completedResult.recordset[0].completed
    const customers = customersResult.recordset[0].customers

    return {
      totalRequests: total,
      pendingRequests: pending,
      completedRequests: completed,
      totalCustomers: customers,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  async getUnconfirmedRequests(): Promise<TestRequestDetail[]> {
    const connection = await getDbPool()

    const result = await connection.request().query(`
      SELECT 
        tr.TestRequestID,
        tr.AccountID,
        tr.ServiceID,
        tr.CollectionMethod,
        tr.Appointment,
        tr.Status,
        tr.CreatedAt,
        tr.UpdatedAt,
        tr.AssignedTo,
        s.ServiceName,
        s.ServiceType,
        s.Price,
        s.SampleCount,
        up.FullName as CustomerName,
        a.Email as CustomerEmail,
        up.PhoneNumber as CustomerPhone,
        up.Address as CustomerAddress,
        ISNULL(
          STUFF((
            SELECT CHAR(10) + sc.TesterName + ' (' + sc.Relationship + ') - ' + sc.SampleType
            FROM SampleCategories sc 
            WHERE sc.TestRequestID = tr.TestRequestID
            FOR XML PATH('')
          ), 1, 1, ''),
          'Chưa có thông tin mẫu'
        ) as TestSubjects,
        th.KitID,
        NULL as StaffName
      FROM TestRequests tr
      INNER JOIN Services s ON tr.ServiceID = s.ServiceID
      INNER JOIN Accounts a ON tr.AccountID = a.AccountID
      LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
      LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
      WHERE tr.Status = 'Pending'
      ORDER BY tr.CreatedAt DESC
    `)

    return result.recordset
  }

  async getConfirmedRequests(staffId: number): Promise<TestRequestDetail[]> {
    const connection = await getDbPool()

    const result = await connection.request().input('staffId', staffId).query(`
        SELECT 
          tr.TestRequestID,
          tr.AccountID,
          tr.ServiceID,
          tr.CollectionMethod,
          tr.Appointment,
          tr.Status,
          tr.CreatedAt,
          tr.UpdatedAt,
          tr.AssignedTo,
          s.ServiceName,
          s.ServiceType,
          s.Price,
          s.SampleCount,
          up.FullName as CustomerName,
          a.Email as CustomerEmail,
          up.PhoneNumber as CustomerPhone,
          up.Address as CustomerAddress,
          ISNULL(
            STUFF((
              SELECT CHAR(10) + sc.TesterName + ' (' + sc.Relationship + ') - ' + sc.SampleType
              FROM SampleCategories sc 
              WHERE sc.TestRequestID = tr.TestRequestID
              FOR XML PATH('')
            ), 1, 1, ''),
            'Chưa có thông tin mẫu'
          ) as TestSubjects,
          th.KitID,
          staff.FullName as StaffName
        FROM TestRequests tr
        INNER JOIN Services s ON tr.ServiceID = s.ServiceID
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
        LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
        LEFT JOIN UserProfiles staff ON tr.AssignedTo = staff.AccountID
        WHERE tr.AssignedTo = @staffId AND tr.Status IN ('Confirmed', 'In Progress', 'Pending Review', 'Verified')
        ORDER BY tr.CreatedAt DESC
      `)

    return result.recordset
  }

  async getRecentUnconfirmedRequests(): Promise<RecentRequest[]> {
    const connection = await getDbPool()

    const result = await connection.request().query(`
      SELECT TOP 5
        tr.TestRequestID,
        up.FullName as CustomerName,
        tr.Status,
        tr.CreatedAt
      FROM TestRequests tr
      INNER JOIN Accounts a ON tr.AccountID = a.AccountID
      LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
      WHERE tr.Status = 'Pending'
      ORDER BY tr.CreatedAt DESC
    `)

    return result.recordset
  }

  async getRequestFullDetail(testRequestId: number): Promise<TestRequestFullDetail> {
    const connection = await getDbPool()

    // Get basic request info
    const requestResult = await connection.request().input('testRequestId', testRequestId).query(`
        SELECT 
          tr.TestRequestID,
          tr.AccountID,
          tr.ServiceID,
          tr.CollectionMethod,
          tr.Appointment,
          tr.Status,
          tr.CreatedAt,
          tr.UpdatedAt,
          tr.AssignedTo,
          s.ServiceName,
          s.ServiceType,
          s.Price,
          s.SampleCount,
          up.FullName as CustomerName,
          a.Email as CustomerEmail,
          up.PhoneNumber as CustomerPhone,
          up.Address as CustomerAddress,
          ISNULL(
            STUFF((
              SELECT CHAR(10) + sc.TesterName + ' (' + sc.Relationship + ') - ' + sc.SampleType
              FROM SampleCategories sc 
              WHERE sc.TestRequestID = tr.TestRequestID
              FOR XML PATH('')
            ), 1, 1, ''),
            'Chưa có thông tin mẫu'
          ) as TestSubjects,
          th.KitID,
          staff.FullName as StaffName
        FROM TestRequests tr
        INNER JOIN Services s ON tr.ServiceID = s.ServiceID
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
        LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
        LEFT JOIN UserProfiles staff ON tr.AssignedTo = staff.AccountID
        WHERE tr.TestRequestID = @testRequestId
      `)

    if (requestResult.recordset.length === 0) {
      throw new Error('Test request not found')
    }

    const requestData = requestResult.recordset[0]
    const staffdata = await connection.request().input('testRequestId', testRequestId)
      .query(`SELECT u.FullName,u.SignatureImage FROM dbo.TestRequests t JOIN dbo.UserProfiles u ON t.AssignedTo = u.AccountID WHERE TestRequestID = @testRequestId
`)
    const cus = await connection
      .request()
      .input('cusid', requestData.AccountID)
      .query(`SELECT * FROM UserProfiles WHERE AccountID=@cusid`)
    // Get sample details
    const samplesResult = await connection.request().input('testRequestId', testRequestId).query(`
        SELECT 
          SampleID,
          TestRequestID,
          TesterName,
          CMND,
          YOB,
          Gender,
          Relationship,
          SampleType,
          Status,
          SignatureImage
        FROM SampleCategories
        WHERE TestRequestID = @testRequestId
        ORDER BY SampleID
      `)

    return {
      cusData: cus.recordset[0],
      staffData: staffdata.recordset[0],
      ...requestData,
      samples: samplesResult.recordset
    }
  }

  async confirmRequest(testRequestId: number, staffId: number): Promise<TestRequestDetail> {
    const connection = await getDbPool()

    // Get test request details first
    const testRequest = await connection
      .request()
      .input('testRequestId', testRequestId)
      .query('SELECT * FROM TestRequests WHERE TestRequestID = @testRequestId')

    if (testRequest.recordset.length === 0) {
      throw new Error('Test request not found')
    }

    const request = testRequest.recordset[0]

    // Update test request status and assign to staff
    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('staffId', staffId)
      .input('status', 'Confirmed').query(`
        UPDATE TestRequests 
        SET Status = @status, AssignedTo = @staffId, UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)

    // Create appropriate test process record
    if (request.CollectionMethod === 'Home') {
      const kitId = 'K' + String(testRequestId)
      await connection
        .request()
        .input('kitId', kitId)
        .input('testRequestId', testRequestId)
        .query('INSERT INTO TestAtHome(KitID, TestRequestID) VALUES (@kitId, @testRequestId)')
    } else if (request.CollectionMethod === 'Facility') {
      await connection
        .request()
        .input('testRequestId', testRequestId)
        .query('INSERT INTO TestAtFacility(TestRequestID) VALUES (@testRequestId)')
    }

    // Return updated request details
    return await this.getRequestById(testRequestId)
  }

  async getRequestById(testRequestId: number): Promise<TestRequestDetail> {
    const connection = await getDbPool()

    const result = await connection.request().input('testRequestId', testRequestId).query(`
        SELECT 
          tr.TestRequestID,
          tr.AccountID,
          tr.ServiceID,
          tr.CollectionMethod,
          tr.Appointment,
          tr.Status,
          tr.CreatedAt,
          tr.UpdatedAt,
          tr.AssignedTo,
          s.ServiceName,
          s.ServiceType,
          s.Price,
          s.SampleCount,
          up.FullName as CustomerName,
          a.Email as CustomerEmail,
          up.PhoneNumber as CustomerPhone,
          up.Address as CustomerAddress,
          ISNULL(
            STUFF((
              SELECT CHAR(10) + sc.TesterName + ' (' + sc.Relationship + ') - ' + sc.SampleType
              FROM SampleCategories sc 
              WHERE sc.TestRequestID = tr.TestRequestID
              FOR XML PATH('')
            ), 1, 1, ''),
            'Chưa có thông tin mẫu'
          ) as TestSubjects,
          th.KitID,
          staff.FullName as StaffName
        FROM TestRequests tr
        INNER JOIN Services s ON tr.ServiceID = s.ServiceID
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
        LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID
        LEFT JOIN UserProfiles staff ON tr.AssignedTo = staff.AccountID
        WHERE tr.TestRequestID = @testRequestId
      `)

    if (result.recordset.length === 0) {
      throw new Error('Test request not found')
    }

    return result.recordset[0]
  }

  async updateRequestStatus(testRequestId: number, status: string, staffId: number): Promise<TestRequestDetail> {
    const connection = await getDbPool()

    await connection.request().input('testRequestId', testRequestId).input('status', status).input('staffId', staffId)
      .query(`
        UPDATE TestRequests 
        SET Status = @status, AssignedTo = @staffId, UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)

    return await this.getRequestById(testRequestId)
  }

  // Method to update to In Progress when sample is confirmed (tick checkbox)
  async confirmSample(testRequestId: number, staffId: number): Promise<TestRequestDetail> {
    const connection = await getDbPool()

    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('status', 'In Progress') // Đang xác nhận kết quả
      .input('staffId', staffId).query(`
        UPDATE TestRequests 
        SET Status = @status, UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId AND AssignedTo = @staffId
      `)

    return await this.getRequestById(testRequestId)
  }

  async createTestResult(testRequestId: number, staffId: number, resultData: string): Promise<void> {
    const connection = await getDbPool()

    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('result', resultData)
      .input('enterBy', staffId).query(`
        INSERT INTO TestResults (TestRequestID, Result, EnterBy, EnterDate, Status)
        VALUES (@testRequestId, @result, @enterBy, GETDATE(), 'Pending')
      `)

    // Update test request status to Pending Review (waiting for manager approval)
    await connection.request().input('testRequestId', testRequestId).input('status', 'Pending') // Chờ manager duyệt
      .query(`
        UPDATE TestRequests 
        SET Status = @status, UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)
  }
}

export const staffService = new StaffService()
