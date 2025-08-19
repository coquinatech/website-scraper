import type { FastifyInstance } from 'fastify';
import { metricsHandler } from '../controllers/metrics.controller.js';

export async function metricsRoutes(app: FastifyInstance) {
  app.get('/metrics', {
    schema: {
      description: 'Prometheus metrics endpoint',
      tags: ['Monitoring'],
      response: {
        200: {
          type: 'string',
          description: 'Prometheus formatted metrics',
        },
      },
    },
  }, metricsHandler);
}