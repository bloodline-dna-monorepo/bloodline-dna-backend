import { poolPromise } from '~/config'

export const createService = async (
  ServiceName: string,
  Description: string,
  Catgory: string,
  NumberSample: number
) => {
  try {
    const pool = await poolPromise
    const insert = await pool
      .request()
      .input('sname', ServiceName)
      .input('Des', Description)
      .input('Cat', Catgory)
      .input('numsa', NumberSample)
      .query('Insert Into Services(ServiceName,Description,Category,NumberSample) VALUES (@sname,@Des,@Cat,@numsa)')
    return insert.recordset[0]
  } catch (error) {
    console.error('Create error:', error)
    throw error
  }
}
