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
    const subject = 'Password Changed Successfully'
    const text = `Hello ${fullName || 'there'},\n\nYour password has been changed successfully.\n\nIf this wasn't you, please contact us.\n\nBest regards,\nGenUnity Team`
    const html = `
      <h2>Password Changed</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your password was changed successfully.</p>
      <p><strong>If you did not perform this action, please contact us immediately.</strong></p>
      <p>Best regards,<br>GenUnity Team</p>
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
    const subject = 'Test Results Available'
    const text = `Hello ${fullName || 'there'},\n\nYour test results for ${serviceName} are ready.\nID: ${registrationId}\n\nPlease log in to download.\n\nBest regards,\nGenUnity Team`
    const html = `
      <h2>Test Results Ready</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your test results for <strong>${serviceName}</strong> are ready.</p>
      <p><strong>Registration ID:</strong> ${registrationId}</p>
      <p>Please log in to download.</p>
      <p>Best regards,<br>GenUnity Team</p>
    `
    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendPasswordResetEmail(email: string, token: string, fullName?: string): Promise<boolean> {
    const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`
    const subject = 'Reset Your Password - GenUnity'
    const text = `Hello ${fullName || 'there'},\n\nClick to reset: ${resetUrl}\n\nThis link expires in 15 minutes.`
    const html = `
      <h2>Reset Password</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 15 minutes.</p>
      <p>Best regards,<br>GenUnity Team</p>
    `
    return await this.sendEmail({ to: email, subject, text, html })
  }

  static async sendPasswordResetConfirmation(email: string, fullName?: string): Promise<boolean> {
    const subject = 'Password Reset Successfully'
    const text = `Hello ${fullName || 'there'},\n\nYour password was reset successfully.\n\nIf you did not do this, contact us immediately.\n\nBest regards,\nGenUnity Team`
    const html = `
      <h2>Password Reset Successful</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your password was reset successfully.</p>
      <p><strong>If this was not you, please contact us immediately.</strong></p>
      <p>Best regards,<br>GenUnity Team</p>
    `
    return await this.sendEmail({ to: email, subject, text, html })
  }
}
