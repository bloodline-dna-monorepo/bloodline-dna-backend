import { Date } from 'mssql'
import { poolPromise } from '~/config'

export const ApprovalTestResult = async (TestResultID: string, Mid: number) => {
  try {
    const pool = await poolPromise
    const update = await pool
      .request()
      .input('TestResultID', TestResultID)
      .input('VerifyBy', Mid)
      .input('Status', 'Verified')
      .query(
        'UPDATE TestResults Set VerifiedBy = @VerifyBy, VerifiedAt= GETDATE(), Status = @Status Where ResultID= @TestResultID'
      )
    return update.recordset[0]
  } catch (error) {
    console.error('Updating error', error)
    throw error
  }
}
