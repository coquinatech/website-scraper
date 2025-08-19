import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes.js';
import { metricsRoutes } from './metrics.routes.js';
import { authRoutes } from './auth.routes.js';
import { userRoutes } from './user.routes.js';
import { exampleRoutes } from './example.routes.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(metricsRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/user' });
  await app.register(exampleRoutes, { prefix: '/api/example' });
}