import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import authPlugin from './plugins/auth.plugin.js';
import { serverConfig } from './config/server.config.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import { traceIdMiddleware } from './middlewares/trace-id.middleware.js';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';
import { registerRoutes } from './routes/index.js';
import { registerSwagger } from './plugins/swagger.plugin.js';
import { initAuthController } from './controllers/auth.controller.js';
import { initUserController } from './controllers/user.controller.js';

export async function createApp() {
  const app = Fastify({
    logger: true, // Enable default logger for now
    requestIdLogLabel: 'requestId',
    genReqId: (req: any) => {
      const existingId = req.headers['x-request-id'];
      return typeof existingId === 'string' ? existingId : (undefined as any);
    },
  });

  // Register security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: serverConfig.corsOrigin,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Register auth plugin (JWT)
  await app.register(authPlugin);

  // Initialize controllers with app instance
  initAuthController(app);
  initUserController(app);

  // Register middlewares (these are actually plugins that add hooks)
  await requestIdMiddleware(app);
  await traceIdMiddleware(app);
  await metricsMiddleware(app);

  // Register Swagger documentation
  await registerSwagger(app);

  // Register routes
  await registerRoutes(app);

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    
    const statusCode = error.statusCode || 500;
    const response = {
      error: statusCode >= 500 ? 'Internal Server Error' : error.message,
      message: error.message,
      statusCode,
    };

    reply.status(statusCode).send(response);
  });

  return app;
}