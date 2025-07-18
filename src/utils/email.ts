import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
}

export class EmailService {
  private static readonly DEFAULT_FROM = process.env.EMAIL_USER || 'genunitycompany@gmail.com'

  private static getTransporter() {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter()

      const mailOptions = {
        from: options.from || this.DEFAULT_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      }

      await transporter.sendMail(mailOptions)
      console.log(`✅ Email sent to ${options.to} with subject: ${options.subject}`)
      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  // --- Template Emails Below ---

  static async sendWelcomeEmail(email: string, fullName?: string): Promise<boolean> {
    const subject = 'Welcome to BloodLine DNA Service'
    const text = `Hello ${fullName || 'there'},\n\nWelcome to GenUnity Company! Your account has been created successfully.\n\nBest regards,\nGenUnity Team`
    const html = `
      <h2>Welcome to GenUnity</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your account has been created successfully.</p>
      <p>Explore our DNA testing services.</p>
      <p>Best regards,<br>GenUnity Team</p>
    `
    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendPasswordChangeNotification(email: string, fullName?: string): Promise<boolean> {
    const subject = 'Thay Đổi Mật Khẩu Thành Công'
    const text = `Xin chào ${fullName || 'bạn'},\n\nMật khẩu của bạn đã được thay đổi thành công.\n\nNếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay.\n\nTrân trọng,\nĐội ngũ GenUnity`
    const html = `
  <h2>Thay Đổi Mật Khẩu</h2>
  <p>Xin chào ${fullName || 'bạn'},</p>
  <p>Mật khẩu của bạn đã được thay đổi thành công.</p>
  <p><strong>Nếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức.</strong></p>
  <p>Trân trọng,<br>Đội ngũ GenUnity</p>
`

    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendServiceRegistrationConfirmation(
    email: string,
    serviceName: string,
    registrationId: number,
    fullName?: string
  ): Promise<boolean> {
    const subject = 'Service Registration Confirmed'
    const text = `Hello ${fullName || 'there'},\n\nYour registration for ${serviceName} is confirmed.\nID: ${registrationId}\n\nBest regards,\nGenUnity Team`
    const html = `
      <h2>Service Registration</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your registration for <strong>${serviceName}</strong> is confirmed.</p>
      <p><strong>Registration ID:</strong> ${registrationId}</p>
      <p>Best regards,<br>GenUnity Team</p>
    `
    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendTestResultsNotification(
    email: string,
    serviceName: string,
    registrationId: number,
    fullName?: string
  ): Promise<boolean> {
    const subject = 'Kết Quả Xét Nghiệm Đã Sẵn Sàng'
    const text = `Xin chào ${fullName || 'bạn'},\n\nKết quả xét nghiệm của bạn cho dịch vụ ${serviceName} đã sẵn sàng.\nMã đăng ký: ${registrationId}\n\nVui lòng đăng nhập để tải xuống.\n\nTrân trọng,\nĐội ngũ GenUnity`
    const html = `
  <h2>Kết Quả Xét Nghiệm Đã Sẵn Sàng</h2>
  <p>Xin chào ${fullName || 'bạn'},</p>
  <p>Kết quả xét nghiệm của bạn cho dịch vụ <strong>${serviceName}</strong> đã sẵn sàng.</p>
  <p><strong>Mã đăng ký:</strong> ${registrationId}</p>
  <p>Vui lòng đăng nhập để tải xuống.</p>
  <p>Trân trọng,<br>Đội ngũ GenUnity</p>
`
    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendPasswordResetEmail(email: string, token: string, fullName?: string): Promise<boolean> {
    const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`
    const subject = 'Đặt Lại Mật Khẩu Của Bạn - GenUnity'
    const text = `Xin Chào ${fullName || 'bạn'},\n\nNhấp vào để đặt lại: ${resetUrl}\n\nLink này sẽ hết hạn trong vòng 15 phút`
    const html = `
  <h2>Đặt Lại Mật Khẩu</h2>
  <p>Xin chào ${fullName || 'bạn'},</p>
  <p>Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu của bạn:</p>
  <p><a href="${resetUrl}">${resetUrl}</a></p>
  <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
  <p>Trân trọng,<br>Đội ngũ GenUnity</p>

    `
    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendPasswordResetConfirmation(email: string, fullName?: string): Promise<boolean> {
    const subject = 'Đặt Lại Mật Khẩu Thành Công'
    const text = `Xin chào ${fullName || 'bạn'},\n\nMật khẩu của bạn đã được đặt lại thành công.\n\nNếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức.\n\nTrân trọng,\nĐội ngũ GenUnity`
    const html = `
  <h2>Đặt Lại Mật Khẩu Thành Công</h2>
  <p>Xin chào ${fullName || 'bạn'},</p>
  <p>Mật khẩu của bạn đã được đặt lại thành công.</p>
  <p><strong>Nếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức.</strong></p>
  <p>Trân trọng,<br>Đội ngũ GenUnity</p>
`
    return await this.sendEmail({ to: email, subject, text, html })
  }
}
