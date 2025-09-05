import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (_req: Request, res: Response) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom logging format
const customFormat = ':method :url :status :response-time-ms - :res[content-length] bytes - :remote-addr';

// Development format with colors
const devFormat = (tokens: any, req: Request, res: Response) => {
  const status = tokens.status(req, res);
  const statusColor = status >= 500 ? '\x1b[31m' // red
    : status >= 400 ? '\x1b[33m' // yellow
    : status >= 300 ? '\x1b[36m' // cyan
    : '\x1b[32m'; // green
  
  return [
    '\x1b[90m' + new Date().toISOString() + '\x1b[0m',
    tokens.method(req, res),
    tokens.url(req, res),
    statusColor + status + '\x1b[0m',
    tokens['response-time'](req, res) + 'ms',
    '-',
    tokens.res(req, res, 'content-length') || '0',
    'bytes'
  ].join(' ');
};

export function createLoggingMiddleware(isDevelopment: boolean = false) {
  if (isDevelopment) {
    return morgan(devFormat);
  }
  return morgan(customFormat);
}