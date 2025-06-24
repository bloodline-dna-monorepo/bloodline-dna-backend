import { getDbPool } from '../config/database'
import type { Service } from '../types/type.d'

class ServiceService {
  async getAllServices(): Promise<Service[]> {
    const connection = await getDbPool()

    const result = await connection.request().query(`
      SELECT 
        ServiceID,
        ServiceName,
        ServiceType,
        Description,
        Price,
        SampleCount,
        CreatedAt,
        UpdatedAt
      FROM Services 
      ORDER BY ServiceType, ServiceName
    `)

    return result.recordset
  }

  async getServiceById(serviceId: number): Promise<Service | null> {
    const connection = await getDbPool()

    const result = await connection.request().input('serviceId', serviceId).query(`
        SELECT 
          ServiceID,
          ServiceName,
          ServiceType,
          Description,
          Price,
          SampleCount,
          CreatedAt,
          UpdatedAt
        FROM Services 
        WHERE ServiceID = @serviceId 
      `)

    return result.recordset[0] || null
  }

  async createService(serviceData: any): Promise<Service> {
    const connection = await getDbPool()

    const result = await connection
      .request()
      .input('serviceName', serviceData.serviceName)
      .input('serviceType', serviceData.serviceType)
      .input('description', serviceData.description)
      .input('price', serviceData.price)
      .input('sampleCount', serviceData.sampleCount)
      .input('collectionMethod', serviceData.collectionMethod).query(`
        INSERT INTO Services (
          ServiceName, ServiceType, Description, Price, 
          SampleCount, CollectionMethod, IsActive, CreatedAt, UpdatedAt
        )
        OUTPUT INSERTED.*
        VALUES (
          @serviceName, @serviceType, @description, @price,
          @sampleCount, @collectionMethod, 1, GETDATE(), GETDATE()
        )
      `)

    return result.recordset[0]
  }

  async updateService(serviceId: number, updateData: any): Promise<Service | null> {
    const connection = await getDbPool()

    const setParts = []
    const request = connection.request().input('serviceId', serviceId)

    if (updateData.serviceName) {
      setParts.push('ServiceName = @serviceName')
      request.input('serviceName', updateData.serviceName)
    }

    if (updateData.serviceType) {
      setParts.push('ServiceType = @serviceType')
      request.input('serviceType', updateData.serviceType)
    }

    if (updateData.description) {
      setParts.push('Description = @description')
      request.input('description', updateData.description)
    }

    if (updateData.price !== undefined) {
      setParts.push('Price = @price')
      request.input('price', updateData.price)
    }

    if (updateData.sampleCount) {
      setParts.push('SampleCount = @sampleCount')
      request.input('sampleCount', updateData.sampleCount)
    }

    if (updateData.collectionMethod) {
      setParts.push('CollectionMethod = @collectionMethod')
      request.input('collectionMethod', updateData.collectionMethod)
    }

    if (setParts.length === 0) {
      return await this.getServiceById(serviceId)
    }

    setParts.push('UpdatedAt = GETDATE()')

    const result = await request.query(`
      UPDATE Services 
      SET ${setParts.join(', ')}
      OUTPUT INSERTED.*
      WHERE ServiceID = @serviceId AND IsActive = 1
    `)

    return result.recordset[0] || null
  }

  async deleteService(serviceId: number): Promise<boolean> {
    const connection = await getDbPool()

    const result = await connection.request().input('serviceId', serviceId).query(`
        UPDATE Services 
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE ServiceID = @serviceId AND IsActive = 1
      `)

    return result.rowsAffected[0] > 0
  }
}

export const serviceService = new ServiceService()
