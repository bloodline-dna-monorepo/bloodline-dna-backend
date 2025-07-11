import { connectToDatabase, getDbPool } from '../config/database'

interface TestRequestData {
  serviceId: number
  collectionMethod: string
  appointmentDate?: string
}

interface SampleInfo {
  fullName: string
  birthYear: number
  gender: string
  relationship: string
  sampleType: string
  commitment: boolean
  signatureImage?: string
}

class TestRequestService {
  async createTestRequest(userId: number | undefined, data: TestRequestData) {
    const connection = await getDbPool()

    const result = await connection
      .request()
      .input('userId', userId)
      .input('serviceId', data.serviceId)
      .input('collectionMethod', data.collectionMethod)
      .input('appointmentDate', data.appointmentDate || null)
      .input('status', 'Input Infor').query(`
        INSERT INTO TestRequests (
          AccountID, ServiceID, CollectionMethod, 
          Appointment, Status, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.TestRequestID
        VALUES (
          @userId, @serviceId, @collectionMethod,
          @appointmentDate, @status, GETDATE(), GETDATE()
        )
      `)

    const testRequestId = result.recordset[0].TestRequestID
    return await this.getTestRequestById(testRequestId)
  }

  async getAllTestRequests() {
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
        s.ServiceName,
        s.ServiceType,
        s.Price,
        s.SampleCount,
        up.FullName as CustomerName,
        a.Email as CustomerEmail
      FROM TestRequests tr
      INNER JOIN Services s ON tr.ServiceID = s.ServiceID
      INNER JOIN Accounts a ON tr.AccountID = a.AccountID
      LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
       WHERE  tr.Status = 'Pending'
      ORDER BY tr.CreatedAt DESC
    `)

    return result.recordset
  }
  async getTestRequestsByStaff(Staffid: number | undefined) {
    const connection = await getDbPool()

    const result = await connection.request().input('id', Staffid).query(`
        SELECT 
          tr.TestRequestID,
          tr.AccountID,
          tr.ServiceID,
          tr.CollectionMethod,
          tr.Appointment,
          tr.Status,
          tr.CreatedAt,
          tr.UpdatedAt,
          s.ServiceName,
          s.ServiceType,
          s.Price,
          s.SampleCount,
          up.FullName as CustomerName,
          a.Email as CustomerEmail
        FROM TestRequests tr
        INNER JOIN Services s ON tr.ServiceID = s.ServiceID
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
        WHERE tr.AssignedTo = @id
        ORDER BY tr.CreatedAt DESC
      `)

    return result.recordset
  }
  async getTestRequestsByCustomer(AccountId: number | undefined) {
    const connection = await getDbPool()

    const result = await connection.request().input('id', AccountId).query(`
       SELECT 
  tr.TestRequestID,
  tr.AccountID,
  tr.ServiceID,
  tr.CollectionMethod,
  tr.Appointment,
  tr.Status,
  tr.CreatedAt,
  tr.UpdatedAt,
  s.ServiceName,
  s.ServiceType,
  s.Price,
  s.SampleCount,
  tr.AssignedTo,
  th.KitID
FROM TestRequests tr
INNER JOIN Services s ON tr.ServiceID = s.ServiceID
LEFT JOIN TestAtHome th ON tr.TestRequestID = th.TestRequestID AND tr.CollectionMethod = 'Home'
LEFT JOIN TestAtFacility tf ON tr.TestRequestID = tf.TestRequestID AND tr.CollectionMethod = 'Facility'
WHERE tr.AccountID = @id
ORDER BY tr.CreatedAt DESC
      `)

    return result.recordset
  }

  async getTestRequestById(testRequestId: number) {
    const connection = await getDbPool()

    const result = await connection.request().input('testRequestId', testRequestId).query(`
        SELECT 
          tr.TestRequestID,
          tr.AccountID,
          tr.ServiceID,
          tr.CollectionMethod,
          tr.Appointment,
          tr.Status,
          tr.AssignedTo,
          tr.CreatedAt,
          tr.UpdatedAt,
          s.ServiceName,
          s.ServiceType,
          s.Price,
          s.SampleCount,
          s.Description,
          up.FullName as CustomerName,
          a.Email as CustomerEmail,
          up.SignatureImage as CustomerSignature
        FROM TestRequests tr
        INNER JOIN Services s ON tr.ServiceID = s.ServiceID
        INNER JOIN Accounts a ON tr.AccountID = a.AccountID
        LEFT JOIN UserProfiles up ON tr.AccountID = up.AccountID
        WHERE tr.TestRequestID = @testRequestId
      `)

    if (result.recordset.length === 0) {
      return null
    }

    const testRequest = result.recordset[0]

    // Get sample information
    // const sampleResult = await connection.request().input('testRequestId', testRequestId).query(`
    //     SELECT * FROM SampleCategories
    //     WHERE TestRequestID = @testRequestId
    //   `)

    // testRequest.sampleInformation = sampleResult.recordset

    return testRequest
  }

  async markInProgress(testRequestId: number, staffId: number | undefined) {
    const connection = await getDbPool()

    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('AssignedTo', staffId)
      .input('status', 'In Progress').query(`
        UPDATE TestRequests 
        SET Status = @status,
            AssignedTo = @AssignedTo,
            UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)

    return await this.getTestRequestById(testRequestId)
  }

  async createTestResult(testRequestId: number, staffId: number | undefined, testResults: string) {
    const connection = await getDbPool()

    // Insert or update test results

    // Insert new results
    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('result', testResults)
      .input('enterBy', staffId).query(`
          INSERT INTO TestResults (TestRequestID, Result, EnterBy, EnterDate)
          VALUES (@testRequestId, @result, @enterBy, GETDATE())
        `)

    // Update test request status

    return await this.getTestRequestById(testRequestId)
  }

  async viewCreateTestResult() {
    const connection = await getDbPool()
    const viewCreateTestResult = await connection.request().query(`Select * from TestResults where Status = 'Verified'`)
    return viewCreateTestResult.recordset
  }

  async completeTestRequestByManager(testRequestId: number, managerId: number | undefined) {
    const connection = await getDbPool()

    // Update test results with manager confirmation
    await connection.request().input('testRequestId', testRequestId).input('confirmedBy', managerId).query(`
        UPDATE TestResults 
        SET ConfirmedBy = @confirmedBy,
            ConfirmedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)

    // Update test request status
    await connection.request().input('testRequestId', testRequestId).input('status', 'Results Available').query(`
        UPDATE TestRequests 
        SET Status = @status,
            UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)

    return await this.getTestRequestById(testRequestId)
  }

  async submitSampleInfoByCustomer(
    testRequestId: number,
    userId: number | undefined,
    SampleType: string,
    TesterName: string,
    CMND: string,
    YOB: number,
    Gender: string,
    Relationship: string,
    File: string
  ) {
    const connection = await getDbPool()

    // Verify customer owns this test request
    const testRequest = await this.getTestRequestById(testRequestId)
    if (!testRequest || testRequest.AccountID !== userId) {
      throw new Error('Unauthorized access to test request')
    }

    // Update test request status
    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('userId', userId)
      .input('SampleType', SampleType)
      .input('TesterName', TesterName)
      .input('CMND', CMND)
      .input('YOB', YOB)
      .input('Gender', Gender)
      .input('Relationship', Relationship)
      .input('file', File).query(`
        Insert Into SampleCategories(SampleType,TestRequestID,TesterName,CMND,YOB,Gender,Relationship,SignatureImage) 
        Values (@SampleType,@testRequestId,@TesterName,@CMND,@YOB,@Gender,@Relationship,@file)
      `)
    await connection
      .request()
      .input('id', testRequestId)
      .query(`UPDATE TestRequests SET Status = 'Pending' WHERE TestRequestID = @id `)

    return await this.getTestRequestById(testRequestId)
  }

  async confirmSampleInfoByStaff(testRequestId: number, staffId: number | undefined) {
    const connection = await getDbPool()
    await connection.request().input('testRequestId', testRequestId).input('status', 'Confirmed').query(`
        UPDATE SampleCategorys 
        SET Status = @status
        WHERE TestRequestID = @testRequestId
      `)
    await connection
      .request()
      .input('testRequestId', testRequestId)
      .input('staffId', staffId)
      .input('status', 'In Progress').query(`
        UPDATE TestRequests 
        SET Status = @status,
            StaffID = @staffId,
            UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)

    return await this.getTestRequestById(testRequestId)
  }

  async getTestResults(testRequestId: number) {
    const connection = await getDbPool()

    const result = await connection.request().input('testRequestId', testRequestId).query(`
        SELECT 
          tr.TestResultID,
          tr.TestRequestID,
          tr.Result,
          tr.EnterBy,
          tr.EnterDate,
          tr.ConfirmBy,
          tr.ConfirmDate,
          staff.FullName as EnteredByName,
          manager.FullName as ConfirmedByName
        FROM TestResults tr
        LEFT JOIN UserProfiles staff ON tr.EnterBy = staff.AccountID
        LEFT JOIN UserProfiles manager ON tr.ConfirmBy = manager.AccountID
        WHERE tr.TestRequestID = @testRequestId
      `)

    return result.recordset[0] || null
  }

  async generateResultsPDF(testRequestId: number): Promise<Buffer> {
    const testRequest = await this.getTestRequestById(testRequestId)
    const results = await this.getTestResults(testRequestId)

    // Simple PDF content generation (in real implementation, use proper PDF library)
    const pdfContent = `
      DNA Test Results Report
      
      Test Request ID: ${testRequest.TestRequestID}
      Service: ${testRequest.ServiceName}
      Service Type: ${testRequest.ServiceType}
      
      Customer Information:
      Name: ${testRequest.CustomerName || 'N/A'}
      Email: ${testRequest.CustomerEmail}
      
      Sample Information:
      ${testRequest.sampleInformation
        .map(
          (sample: any) => `
        Sample ${sample.SampleNumber}:
        - Name: ${sample.FullName}
        - Birth Year: ${sample.BirthYear}
        - Gender: ${sample.Gender}
        - Relationship: ${sample.Relationship}
        - Sample Type: ${sample.SampleType}
      `
        )
        .join('\n')}
      
      Test Results:
      ${results ? JSON.stringify(JSON.parse(results.Results), null, 2) : 'Results not available'}
      
      Report Generated: ${new Date().toISOString()}
    `

    return Buffer.from(pdfContent, 'utf8')
  }
  async VerifytestResultByManager(testResultId: number, managerId: number | undefined) {
    const connection = await getDbPool()
    const update = await connection
      .request()
      .input('id', testResultId)
      .input('Mid', managerId)
      .input('status', 'Verified')
      .query('Update TestResults Set ConfirmBy = @Mid, Status = @status WHERE TestResultID = @id')

    const result = await connection
      .request()
      .input('id', testResultId)
      .query('SELECT * From TestResults WHERE TestResultID = @id')
    const updatereq = await connection
      .request()
      .input('testRequestId', result.recordset[0].TestRequestID)
      .input('status', 'Completed').query(`
        UPDATE TestRequests 
        SET Status = @status,
            UpdatedAt = GETDATE()
        WHERE TestRequestID = @testRequestId
      `)
    return result.recordset
  }
}

export const testRequestService = new TestRequestService()
