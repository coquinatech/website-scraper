import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { createRequestLogger } from '../utils/logger.js';

// Extend Fastify request type to include requestId
declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    // Override the log property with our logger type
  }
}

/**
 * Middleware to generate and attach request IDs to all requests
 * Also creates a child logger with the request ID for tracing
 */
export async function requestIdMiddleware(fastify: any): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Check if request already has an ID (from client or proxy)
    const existingId =
      request.headers['x-request-id'] ||
      request.headers['x-correlation-id'] ||
      request.headers['x-trace-id'];

    // Use existing ID or generate a new one
    const requestId = (existingId as string) || randomUUID();

    // Attach to request object
    request.requestId = requestId;

    // Create request-specific logger
    request.log = createRequestLogger(requestId);

    // Add to response headers for client correlation
    reply.header('x-request-id', requestId);

    // Log request with ID
    request.log.info(
      {
        method: request.method,
        url: request.url,
        headers: {
          'user-agent': request.headers['user-agent'],
          'content-type': request.headers['content-type'],
        },
      },
      'incoming request'
    );
  });

  // Log response details
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log.info(
      {
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed'
    );
  });
}
