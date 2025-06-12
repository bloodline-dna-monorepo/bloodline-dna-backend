// src/type.d.ts

import { Request } from 'express'

// Define roles as a constant object to easily reference later
export const roles = ['admin', 'manager', 'staff', 'customer'] as const

// Define Role type using the constant array
export type Role = (typeof roles)[number]

// AuthUser interface defines the user object with role, userId and email
export interface AuthUser {
  accountId: number
  email: string
  role: Role
}

// AuthRequest extends Express' Request interface, adding an optional 'user' property
export interface AuthRequest extends Request {
  user?: AuthUser // The user data that can be available in the request after authentication
}
