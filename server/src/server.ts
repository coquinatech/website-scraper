import { createApp } from './app.js';
import { serverConfig } from './config/server.config.js';
import { logger } from './utils/logger.js';
import { initializeTracing } from './utils/tracing.js';
import { runMigrations } from './db/migrate.js';

async function start() {
  try {
    // Initialize OpenTelemetry tracing
    await initializeTracing();

    // Run database migrations
    logger.info('Running database migrations...');
    await runMigrations();
    logger.info('Database migrations completed');

    // Create and start the Fastify app
    const app = await createApp();

    await app.listen({
      host: serverConfig.host,
      port: serverConfig.port,
    });

    logger.info(
      {
        port: serverConfig.port,
        host: serverConfig.host,
        environment: serverConfig.nodeEnv,
      },
      'Server started successfully'
    );

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, closing server gracefully...`);
        await app.close();
        process.exit(0);
      });
    }
  } catch (error) {
    logger.fatal(error, 'Failed to start server');
    process.exit(1);
  }
}

start();