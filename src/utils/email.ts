// Email utility functions for sending notifications
// This is a placeholder implementation - in production, you would use a service like SendGrid, Nodemailer, etc.

export interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
}

export class EmailService {
  private static readonly DEFAULT_FROM = 'noreply@bloodlinedna.com'

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In production, implement actual email sending logic here
      console.log('Sending email:', {
        from: options.from || this.DEFAULT_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      })

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  static async sendWelcomeEmail(email: string, fullName?: string): Promise<boolean> {
    const subject = 'Welcome to BloodLine DNA Service'
    const text = `Hello ${fullName || 'there'},\n\nWelcome to BloodLine DNA Service! Your account has been created successfully.\n\nBest regards,\nBloodLine DNA Team`
    const html = `
      <h2>Welcome to BloodLine DNA Service</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Welcome to BloodLine DNA Service! Your account has been created successfully.</p>
      <p>You can now log in to your account and explore our DNA testing services.</p>
      <p>Best regards,<br>BloodLine DNA Team</p>
    `

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    })
  }

  static async sendPasswordChangeNotification(email: string, fullName?: string): Promise<boolean> {
    const subject = 'Password Changed Successfully'
    const text = `Hello ${fullName || 'there'},\n\nYour password has been changed successfully.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nBloodLine DNA Team`
    const html = `
      <h2>Password Changed Successfully</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your password has been changed successfully.</p>
      <p><strong>If you did not make this change, please contact our support team immediately.</strong></p>
      <p>Best regards,<br>BloodLine DNA Team</p>
    `

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    })
  }

  static async sendServiceRegistrationConfirmation(
    email: string,
    serviceName: string,
    registrationId: number,
    fullName?: string
  ): Promise<boolean> {
    const subject = 'Service Registration Confirmation'
    const text = `Hello ${fullName || 'there'},\n\nYour registration for ${serviceName} has been confirmed.\n\nRegistration ID: ${registrationId}\n\nWe will contact you soon with further details.\n\nBest regards,\nBloodLine DNA Team`
    const html = `
      <h2>Service Registration Confirmation</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your registration for <strong>${serviceName}</strong> has been confirmed.</p>
      <p><strong>Registration ID:</strong> ${registrationId}</p>
      <p>We will contact you soon with further details.</p>
      <p>Best regards,<br>BloodLine DNA Team</p>
    `

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    })
  }

  static async sendTestResultsNotification(
    email: string,
    serviceName: string,
    registrationId: number,
    fullName?: string
  ): Promise<boolean> {
    const subject = 'Test Results Available'
    const text = `Hello ${fullName || 'there'},\n\nYour test results for ${serviceName} are now available.\n\nRegistration ID: ${registrationId}\n\nPlease log in to your account to view and download your results.\n\nBest regards,\nBloodLine DNA Team`
    const html = `
      <h2>Test Results Available</h2>
      <p>Hello ${fullName || 'there'},</p>
      <p>Your test results for <strong>${serviceName}</strong> are now available.</p>
      <p><strong>Registration ID:</strong> ${registrationId}</p>
      <p>Please log in to your account to view and download your results.</p>
      <p>Best regards,<br>BloodLine DNA Team</p>
    `

    return await this.sendEmail({
      to: email,
      subject,
      text,
      html
    })
  }
}
