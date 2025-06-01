export type Role = 'admin' | 'manager' | 'staff' | 'customer';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: Role;
}
