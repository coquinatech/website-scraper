import type { FastifyRequest, FastifyReply } from 'fastify';
import { getCurrentTraceId } from '../utils/tracing.js';

export async function traceIdMiddleware(fastify: any) {
  // Use preHandler hook instead of onRequest to ensure trace context is available
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const traceId = getCurrentTraceId();
    if (traceId) {
      reply.header('X-Trace-Id', traceId);
      request.log = request.log.child({ traceId });
    }
  });
}
