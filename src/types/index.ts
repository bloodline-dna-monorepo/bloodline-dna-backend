// Common types used across the application

export type Role = 'Admin' | 'Manager' | 'Staff' | 'Customer'

export interface User {
  accountId: number
  email: string
  role: Role
  fullName?: string
  address?: string
  dateOfBirth?: string
}

export interface AuthUser {
  accountId: number
  email: string
  role: Role
}

export interface ServiceData {
  ServiceID: number
  ServiceName: string
  Description: string
  Category: string
  Price2Samples: number
  Price3Samples: number
  TimeToResult: string
}

export interface AppointmentData {
  TestRequestID: number
  ScheduleDate: string
  Address: string
  Status: string
  CreatedAt: string
  ServiceName: string
  Description: string
  TestType: string
  PaymentAmount?: number
  PaymentMethod?: string
  PaidAt?: string
}

export interface SampleCategoryData {
  SampleID: number
  sampleType: string
  ownerName: string
  gender: string
  relationship: string
  yob: number
}

export interface TestResultData {
  ResultID: number
  ResultData: string
  EnteredAt: string
  VerifiedAt?: string
  Status: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export interface PaymentData {
  amount: number
  orderInfo: string
  testRequestId: number
  returnUrl: string
}

export interface PaymentResult {
  paymentUrl: string
  transactionId: string
}

export interface AppointmentFilters {
  status?: string
  page: number
  limit: number
}

export interface StatusUpdateData {
  status: string
  kitId?: string
  notes?: string
  updatedBy?: number
}

export interface TestResultSubmission {
  result: string
  notes?: string
  images?: string[]
  submittedBy?: number
}
