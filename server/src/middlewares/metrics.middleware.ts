import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInFlight,
  getRoutePattern,
} from '../utils/metrics.js';

/**
 * Middleware to collect HTTP metrics for all requests
 * Implements RED (Rate, Errors, Duration) metrics pattern
 */
export async function metricsMiddleware(fastify: any): Promise<void> {
  // Track requests in flight
  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    // Skip metrics endpoint to avoid recursion
    if (request.url === '/metrics') {
      return;
    }

    const route = getRoutePattern(request.url, (request as any).routerPath);
    const method = request.method;

    // Increment in-flight gauge
    httpRequestsInFlight.inc({ method, route });

    // Store start time for duration calculation
    request.startTime = process.hrtime.bigint();
  });

  // Collect metrics after response
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip metrics endpoint
    if (request.url === '/metrics') {
      return;
    }

    const route = getRoutePattern(request.url, (request as any).routerPath);
    const method = request.method;
    const statusCode = reply.statusCode.toString();

    // Decrement in-flight gauge
    httpRequestsInFlight.dec({ method, route });

    // Increment request counter
    httpRequestsTotal.inc({ method, route, status_code: statusCode });

    // Calculate and record duration if we have a start time
    if (request.startTime) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - request.startTime) / 1e9; // Convert to seconds

      httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    }
  });
}

// Extend Fastify request type to include startTime
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: bigint;
  }
}
