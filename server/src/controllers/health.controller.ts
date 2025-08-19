import type { FastifyRequest, FastifyReply } from 'fastify';
import type { HealthCheckResponse } from '../types/health.types.js';

export async function healthCheck(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  if (process.env['NODE_ENV']) {
    response.environment = process.env['NODE_ENV'];
  }

  if (process.env['npm_package_version']) {
    response.version = process.env['npm_package_version'];
  }

  // Log health check requests at debug level to reduce noise
  request.log.debug(
    {
      path: '/health',
      uptime: response.uptime,
    },
    'Health check requested'
  );

  await reply.code(200).send(response);
}
