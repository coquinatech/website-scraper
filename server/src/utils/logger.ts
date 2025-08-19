import type { Logger, LoggerOptions } from 'pino';
import pino from 'pino';
import { getCurrentTraceId } from './tracing.js';

// Environment configuration
const isProduction = process.env['NODE_ENV'] === 'production';
const isDevelopment = process.env['NODE_ENV'] === 'development';
const isTest = process.env['NODE_ENV'] === 'test';

// Log levels per environment (can be overridden by LOG_LEVEL env var)
const getLogLevel = (): string => {
  if (process.env['LOG_LEVEL']) {
    return process.env['LOG_LEVEL'];
  }

  if (isDevelopment) {
    return 'debug';
  }
  if (isTest) {
    return 'error';
  } // Quiet during tests
  if (isProduction) {
    return 'warn';
  }
  return 'info';
};

// PII Redaction patterns
const redactPaths = [
  'password',
  'token',
  'api_key',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

// Base logger configuration
const baseConfig: LoggerOptions = {
  level: getLogLevel(),
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: () => ({
      pid: process.pid,
      hostname: process.env['HOSTNAME'] || 'localhost',
    }),
  },
  base: {
    service: 'server',
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0',
  },
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      parameters: req.parameters,
      query: req.query,
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Create logger with appropriate transport
let logger: Logger;

if (isTest) {
  // Quiet logger for tests (not completely silent for Fastify compatibility)
  logger = pino({
    ...baseConfig,
    level: 'error', // Only show errors in tests
  });
} else if (isDevelopment) {
  // Development: Pretty console + Custom Loki transport
  // Using custom transport to work around:
  // 1. Pino v9.x transport level filtering bug (pinojs/pino#1996)
  // 2. pino-loki v2.6.0 level filtering bugs

  const transport = pino.transport({
    targets: [
      {
        target: 'pino-pretty',
        level: 'trace',
        options: {
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          colorize: true,
          singleLine: false,
          messageFormat: '{component} | {msg}',
        },
      },
      {
        target: '/workspace/server/dist/utils/loki-transport.js',
        level: 'trace', // Send all levels, let transport filter
        options: {
          host: process.env['LOKI_HOST'] || 'http://loki:3100',
          labels: {
            app: 'server',
            environment: 'development',
          },
          minLevel: 30, // Only send info (30) and above to Loki
          interval: 2000,
          batchSize: 50,
        },
      },
    ],
  });

  logger = pino(baseConfig, transport);
} else {
  // Production: JSON to stdout (for container log collectors)
  logger = pino(baseConfig);
}

// Factory function for creating child loggers
export const createLogger = (
  component: string,
  additionalContext?: Record<string, any>
): Logger => {
  const traceId = getCurrentTraceId();
  return logger.child({
    component,
    ...(traceId && { traceId }),
    ...additionalContext,
  });
};

// Pre-configured component loggers
export const httpLogger = createLogger('http');
export const dbLogger = createLogger('database');
export const workflowLogger = createLogger('workflow');
export const businessLogger = createLogger('business');
export const systemLogger = createLogger('system');

// Helper function to log with request context
export const createRequestLogger = (requestId: string, traceId?: string): Logger => {
  return logger.child({
    requestId,
    traceId,
    component: 'request',
  });
};

// PII scrubbing helper
export const scrubPII = (text: string): string => {
  // Email addresses
  text = text.replace(
    /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match, localPart, domain) => {
      const maskedLocal = localPart[0] + '***';
      return `${maskedLocal}@${domain}`;
    }
  );

  // Phone numbers (US format)
  text = text.replace(/(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, (match) => {
    const last4 = match.replace(/\D/g, '').slice(-4);
    return `***-***-${last4}`;
  });

  // API keys (common patterns)
  text = text.replace(/(sk|pk|api|key|token)[-_]?[A-Za-z0-9]{8,}/gi, (match) => {
    return match.substring(0, 8) + '***';
  });

  return text;
};

// Graceful shutdown handler to flush logs
export const flushLogs = async (): Promise<void> => {
  if (isDevelopment && logger) {
    // Give time for final batch to be sent
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

// Register shutdown handlers
if (typeof process !== 'undefined') {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, flushing logs...`);
    await flushLogs();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('beforeExit', () => flushLogs());
}

// Default export
export { logger };
export default logger;

// Type exports
export type { Logger } from 'pino';
