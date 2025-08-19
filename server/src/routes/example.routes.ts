import type { FastifyInstance } from 'fastify';
import { getExample, createExample, errorExample } from '../controllers/example.controller.js';

export async function exampleRoutes(app: FastifyInstance) {
  app.get('/', {
    schema: {
      description: 'Example GET endpoint with logging and tracing',
      tags: ['Examples'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            timestamp: { type: 'string' },
            requestId: { type: 'string' },
            traceId: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                      value: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, getExample);

  app.post('/', {
    schema: {
      description: 'Example POST endpoint with validation',
      tags: ['Examples'],
      body: {
        type: 'object',
        required: ['name', 'value'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          value: { type: 'number', minimum: 0.01 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            item: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                value: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array' },
          },
        },
      },
    },
  }, createExample);

  app.get('/error', {
    schema: {
      description: 'Example endpoint that demonstrates error handling (50% error rate)',
      tags: ['Examples'],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            tip: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
          },
        },
      },
    },
  }, errorExample);
}