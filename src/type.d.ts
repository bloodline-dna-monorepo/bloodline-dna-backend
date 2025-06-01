// src/type.d.ts

import { Request } from 'express';

export type Role = 'admin' | 'manager' | 'staff' | 'customer';

export interface AuthUser {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
