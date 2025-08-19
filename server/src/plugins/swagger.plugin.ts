import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(fastify: any) {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Server API',
        version: '1.0.0',
        description: 'AI Agent Orchestration Platform with DBOS Workflow Support',
        contact: {
          name: 'Team',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:5173',
          description: 'Development Server',
        },
        {
          url: 'http://server:5173',
          description: 'Docker Development Server',
        }
      ],
      tags: [
        {
          name: 'Auth',
          description: 'Authentication and authorization endpoints',
        },
        {
          name: 'health',
          description: 'Health check and monitoring endpoints',
        },
        {
          name: 'metrics',
          description: 'Prometheus metrics endpoint',
        },
        {
          name: 'workflows',
          description: 'Workflow execution endpoints',
        },
        {
          name: 'conversations',
          description: 'Conversation management endpoints',
        },
        {
          name: 'streaming',
          description: 'Server-Sent Events (SSE) streaming endpoints',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT authentication token',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              statusCode: { type: 'integer' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
            required: ['statusCode', 'message'],
          },
          HealthResponse: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['ok', 'error'],
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              version: { type: 'string' },
            },
            required: ['status', 'timestamp'],
          },
          ConversationId: {
            type: 'string',
            format: 'uuid',
            description: 'Unique conversation identifier',
          },
          Role: {
            type: 'string',
            enum: ['user', 'assistant', 'system'],
            description: 'Message role in conversation',
          },
          Message: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                const: 'message',
              },
              role: { $ref: '#/components/schemas/Role' },
              content: { type: 'string' },
              sequence: { type: 'integer' },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
            },
            required: ['type', 'role', 'content', 'sequence', 'timestamp'],
          },
          ToolCall: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              arguments: {
                type: 'object',
                additionalProperties: true,
              },
              status: {
                type: 'string',
                enum: ['pending', 'executing', 'completed', 'failed'],
              },
              response: { type: 'string' },
              error: { type: 'string' },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              completed_at: {
                type: 'string',
                format: 'date-time',
              },
            },
            required: ['id', 'name', 'arguments', 'status', 'timestamp'],
          },
          Conversation: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/ConversationId' },
              entries: {
                type: 'array',
                items: {
                  oneOf: [
                    { $ref: '#/components/schemas/Message' },
                    {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          const: 'tool_call',
                        },
                        calls: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ToolCall' },
                        },
                        sequence: { type: 'integer' },
                        timestamp: {
                          type: 'string',
                          format: 'date-time',
                        },
                      },
                    },
                  ],
                },
              },
              next_sequence: { type: 'integer' },
              created_at: {
                type: 'string',
                format: 'date-time',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
              },
            },
            required: ['id', 'entries', 'next_sequence', 'created_at', 'updated_at'],
          },
        },
      }
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
    },
    uiHooks: {
      onRequest: function (_request: any, _reply: any, next: any) {
        next();
      },
      preHandler: function (_request: any, _reply: any, next: any) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: any, _request: any, _reply: any) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Add custom CSS for better UI
  fastify.addHook('onReady', () => {
    fastify.log.info('Swagger documentation available at /documentation');
  });
}

export const swaggerOptions = {
  routePrefix: '/documentation/json',
  exposeRoute: true,
  mode: 'dynamic',
  refResolver: {
    buildLocalReference: (json: any) => {
      return json.$id || json.title || 'def-' + Math.random();
    },
  },
};
