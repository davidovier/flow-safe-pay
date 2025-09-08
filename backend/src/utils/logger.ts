import { createWriteStream } from 'fs';
import { join } from 'path';
import { pino } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
const logsDir = join(process.cwd(), 'logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Configure log levels and outputs
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Create streams for different log levels
const streams = [];

if (isDevelopment) {
  // Pretty print for development
  streams.push({
    level: 'debug',
    stream: pino.destination({
      dest: 1, // stdout
      sync: false
    })
  });
} else {
  // Production logging
  streams.push(
    {
      level: 'info',
      stream: createWriteStream(join(logsDir, 'app.log'), { flags: 'a' })
    },
    {
      level: 'error',
      stream: createWriteStream(join(logsDir, 'error.log'), { flags: 'a' })
    }
  );
}

// Don't log anything in test environment unless explicitly enabled
if (isTest && !process.env.ENABLE_TEST_LOGGING) {
  streams.length = 0;
  streams.push({
    level: 'silent',
    stream: pino.destination('/dev/null')
  });
}

// Create logger instance
export const logger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      }
    },
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    })
  },
  streams.length > 1 ? pino.multistream(streams) : streams[0]?.stream
);

// Add request ID context for better tracing
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

// Structured logging helpers
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    err: error,
    ...context
  }, error.message);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(context, message);
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  logger.warn(context, message);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(context, message);
};

// Export logger as default for backward compatibility
export default logger;