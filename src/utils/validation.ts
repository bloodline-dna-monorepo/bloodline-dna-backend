// Validation utilities

/**
 * Validates an email address
 * @param email Email address to validate
 * @returns Boolean indicating if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

/**
 * Validates a password
 * @param password Password to validate
 * @returns Boolean indicating if password is valid
 */
export const isValidPassword = (password: string): boolean => {
  // Password must be 6-12 characters
  return password.length >= 6 && password.length <= 12
}

/**
 * Validates a date string in YYYY-MM-DD format
 * @param dateString Date string to validate
 * @returns Boolean indicating if date is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Validates that a value is not empty
 * @param value Value to check
 * @returns Boolean indicating if value is not empty
 */
export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim() !== ''
}

/**
 * Validates that a number is within a range
 * @param value Number to check
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns Boolean indicating if number is within range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max
}
