import type { FastifyRequest, FastifyReply } from 'fastify';
import { getMetrics } from '../utils/metrics.js';

/**
 * Prometheus metrics endpoint handler
 * Returns metrics in Prometheus text format
 */
export async function metricsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const metrics = await getMetrics();

    // Set the correct content type for Prometheus
    reply.type('text/plain; version=0.0.4; charset=utf-8');

    return reply.send(metrics);
  } catch (error) {
    request.log.error({ err: error }, 'Failed to generate metrics');

    return reply.status(500).send({
      error: 'Failed to generate metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
