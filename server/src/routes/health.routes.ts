import type { FastifyInstance } from 'fastify';
import { healthCheck } from '../controllers/health.controller.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            version: { type: 'string' },
          },
        },
      },
    },
  }, healthCheck);
}