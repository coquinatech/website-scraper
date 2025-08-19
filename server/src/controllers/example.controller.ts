import type { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Example of structured logging and observability
export async function getExample(request: FastifyRequest, reply: FastifyReply) {
  // Log the request with structured data
  request.log.info(
    {
      method: 'GET',
      path: '/api/example',
      query: request.query,
    },
    'Example endpoint called'
  );

  // Simulate some processing time for tracing
  await new Promise(resolve => setTimeout(resolve, 50));

  return reply.send({
    message: 'This is an example GET endpoint',
    timestamp: new Date().toISOString(),
    requestId: request.id,
    traceId: request.headers['x-trace-id'] || 'not-set',
    data: {
      items: [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 },
      ],
    },
  });
}

const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.number().positive(),
});

export async function createExample(
  request: FastifyRequest<{ Body: z.infer<typeof createItemSchema> }>,
  reply: FastifyReply
) {
  try {
    // Validate input
    const data = createItemSchema.parse(request.body);

    // Log the creation attempt
    request.log.info(
      {
        method: 'POST',
        path: '/api/example',
        data,
      },
      'Creating example item'
    );

    // Simulate database operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return created item
    return reply.status(201).send({
      message: 'Item created successfully',
      item: {
        id: Math.floor(Math.random() * 10000),
        ...data,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      request.log.warn({ error: error.errors }, 'Validation failed');
      return reply.status(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    throw error;
  }
}

// Example of error handling and logging
export async function errorExample(request: FastifyRequest, reply: FastifyReply) {
  request.log.warn('Error example endpoint called - this will generate an error');

  // Randomly succeed or fail to demonstrate error handling
  if (Math.random() > 0.5) {
    throw new Error('This is an example error for demonstrating error handling and logging');
  }

  return reply.send({
    message: 'Lucky! No error this time.',
    tip: 'This endpoint has a 50% chance of throwing an error to demonstrate error handling.',
  });
}