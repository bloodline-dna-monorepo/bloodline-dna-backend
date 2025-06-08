export type Role = 'admin' | 'manager' | 'staff' | 'customer'

export interface User {
  id: number
  email: string
  passwordHash: string
  role: Role
  createdAt: Date // Thêm thời gian tạo tài khoản
  updatedAt: Date // Thêm thời gian cập nhật tài khoản
  isActive: boolean // Trạng thái tài khoản (active/inactive)
}

export interface AdminUser extends User {
  permissions: string[] // Danh sách quyền của admin (ví dụ: 'manage_users', 'view_reports')
}
