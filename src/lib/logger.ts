import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevel = process.env.LOG_LEVEL || 'info';

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: logLevel,
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(info => `${info.timestamp as string} ${info.level}: ${info.message}`)
    )
  })
];

try {
  transports.push(
    new DailyRotateFile({
      level: logLevel,
      dirname: 'logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true
    })
  );
} catch {
  // Ignore if file system is not writable
}

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  defaultMeta: { service: 'n8n-backend' },
  transports
});


