import winston from 'winston'
import path from 'path'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  return env === 'development' ? 'debug' : 'warn'
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

// Add colors to winston
winston.addColors(colors)

// Define format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
)

// Define format for file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json()
)

// Define log files
const logDir = 'logs'
const errorLogPath = path.join(logDir, 'error.log')
const combinedLogPath = path.join(logDir, 'combined.log')

// Create logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Error log file transport
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
      format: fileFormat
    }),
    // Combined log file transport
    new winston.transports.File({
      filename: combinedLogPath,
      format: fileFormat
    })
  ]
})

export default logger
