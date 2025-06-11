import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

// Custom error class with status code
export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Error handler middleware
export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction): void => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`)
  if (err.stack) {
    logger.error(err.stack)
  }

  // Default to 500 server error
  let statusCode = 500
  let message = 'Internal Server Error'

  // If it's our custom API error, use its status code and message
  if (err instanceof ApiError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from a validation library)
    statusCode = 400
    message = err.message
  } else if (err.name === 'UnauthorizedError') {
    // Handle auth errors
    statusCode = 401
    message = 'Unauthorized'
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

// Async handler to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
