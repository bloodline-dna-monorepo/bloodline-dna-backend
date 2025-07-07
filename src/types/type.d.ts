// Enum cho Role
export enum Role {
  Admin = 'Admin',
  Manager = 'Manager',
  Staff = 'Staff',
  Customer = 'Customer'
}

// Enum cho ServiceType
export enum ServiceType {
  Administrative = 'Administrative',
  Civil = 'Civil'
}

// Enum cho SampleCount
export enum SampleCount {
  Two = 2,
  Three = 3
}

// Enum cho CollectionMethod
export enum CollectionMethod {
  Home = 'Home',
  Facility = 'Facility'
}

// Enum cho PaymentStatus
export enum PaymentStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
  Refunded = 'Refunded'
}

// Enum cho TestRequest Status
export enum TestRequestStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

// Interface cho Account
export interface Account {
  AccountID: number
  Email: string
  PasswordHash: string
  RoleID: number
  CreatedAt: Date
}

// Interface cho UserProfile
export interface UserProfile {
  ProfileID: number
  AccountID: number
  FullName: string
  Email: string
  PhoneNumber: string
  Address: string
  DateOfBirth: Date
  SignatureImage: string
  CreatedAt: Date
  UpdatedAt: Date
}

// Interface cho RefreshToken
export interface RefreshToken {
  TokenID: number
  AccountID: number
  Token: string
  ExpiresAt: Date
  Revoked: boolean
  CreatedAt: Date
}

// // Interface cho Payment
// export interface Payment {
//   PaymentID: number
//   RegistrationID: number
//   Amount: number
//   PaymentMethod: string
//   PaymentStatus: PaymentStatus
//   TransactionID: string | null
//   PaymentDate: Date
//   CreatedAt: Date
//   UpdatedAt: Date
// }

// Interface cho LoginRequest
export interface LoginRequest {
  Email: string
  Password: string
}

// Interface cho RegisterRequest
export interface RegisterRequest {
  Email: string
  Password: string
  ConfirmPassword: string
}

// Interface cho ChangePasswordRequest
export interface ChangePasswordRequest {
  OldPassword: string
  NewPassword: string
  ConfirmNewPassword: string
}

interface Service {
  id: number
  serviceName: string
  serviceType: 'Administrative' | 'Civil'
  price: number
  description: string
  sampleCount: 2 | 3
  collectionMethod: 'Home' | 'Facility'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface Payment {
  id: number
  userId: number
  serviceId: number
  amount: number
  collectionMethod: string
  appointmentDate?: Date
  appointmentTime?: string
  status: 'Pending' | 'Completed' | 'Failed' | 'Cancelled'
  vnpayTransactionId?: string
  vnpayResponseCode?: string
  createdAt: Date
  updatedAt: Date
}

interface TestRequest {
  id: number
  userId: number
  serviceId: number
  paymentId: number
  collectionMethod: string
  appointmentDate?: Date
  appointmentTime?: string
  status: string
  assignedStaffId?: number
  kitCode?: string
  staffSignature?: string
  approvedBy?: number
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface SampleInformation {
  id: number
  testRequestId: number
  fullName: string
  birthYear: number
  gender: 'Male' | 'Female'
  relationship: string
  sampleType: string
  commitment: boolean
  signatureImage?: string
  createdAt: Date
}

interface TestResult {
  id: number
  testRequestId: number
  results: string
  enteredBy: number
  enteredAt: Date
}
