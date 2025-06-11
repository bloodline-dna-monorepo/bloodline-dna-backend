import crypto from 'crypto'
import sql from 'mssql'
import { dbConfig } from '~/config'

export class KitService {
  static generateKitId(): string {
    const timestamp = Date.now().toString()
    const random = crypto.randomBytes(4).toString('hex').toUpperCase()
    return `KIT${timestamp.slice(-6)}${random}`
  }

  static validateKitId(kitId: string): boolean {
    const kitPattern = /^KIT\d{6}[A-F0-9]{8}$/
    return kitPattern.test(kitId)
  }

  static async assignKitToTestRequest(testRequestId: number, staffId: number): Promise<string> {
    try {
      const kitId = this.generateKitId()
      const pool = await sql.connect(dbConfig)

      await pool
        .request()
        .input('testRequestId', sql.Int, testRequestId)
        .input('kitId', sql.NVarChar(50), kitId)
        .input('status', sql.NVarChar(50), 'Generated').query(`
          INSERT INTO KitTracking (TestRequestID, KitID, Status, CreatedAt)
          VALUES (@testRequestId, @kitId, @status, GETDATE())
        `)

      // Update test request status
      await pool.request().input('testRequestId', sql.Int, testRequestId).input('status', sql.NVarChar(50), 'Kit_Sent')
        .query(`
          UPDATE TestRequest SET Status = @status WHERE TestRequestID = @testRequestId
        `)

      // Log status change
      await pool
        .request()
        .input('testRequestId', sql.Int, testRequestId)
        .input('status', sql.NVarChar(50), 'Kit_Sent')
        .input('updatedBy', sql.Int, staffId)
        .input('notes', sql.NVarChar(500), `Kit ${kitId} assigned and sent`).query(`
          INSERT INTO TestRequestStatus (TestRequestID, Status, UpdatedBy, Notes, CreatedAt)
          VALUES (@testRequestId, @status, @updatedBy, @notes, GETDATE())
        `)

      return kitId
    } catch (error) {
      console.error('Assign kit to test request error:', error)
      throw error
    }
  }

  static async updateKitStatus(kitId: string, status: string, staffId: number): Promise<void> {
    try {
      const pool = await sql.connect(dbConfig)

      await pool.request().input('kitId', sql.NVarChar(50), kitId).input('status', sql.NVarChar(50), status).query(`
          UPDATE KitTracking 
          SET Status = @status, UpdatedAt = GETDATE()
          WHERE KitID = @kitId
        `)

      // Update test request status based on kit status
      let testRequestStatus = status
      if (status === 'Received') {
        testRequestStatus = 'Sample_Received'
      } else if (status === 'Processing') {
        testRequestStatus = 'In_Testing'
      }

      await pool.request().input('kitId', sql.NVarChar(50), kitId).input('status', sql.NVarChar(50), testRequestStatus)
        .query(`
          UPDATE TestRequest 
          SET Status = @status
          WHERE TestRequestID = (
            SELECT TestRequestID FROM KitTracking WHERE KitID = @kitId
          )
        `)
    } catch (error) {
      console.error('Update kit status error:', error)
      throw error
    }
  }
}
