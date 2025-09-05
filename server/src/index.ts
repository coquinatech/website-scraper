import express from 'express';
import { getServerConfig, getStorageConfig } from './config.js';
import { createStorageEngine } from './storage/factory.js';
import { createArchiveRouter } from './routes/archive.js';
import { createLoggingMiddleware } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

async function startServer() {
  // Load configuration
  const serverConfig = getServerConfig();
  const storageConfig = getStorageConfig();
  
  console.log('Starting Archive Viewer Server...');
  console.log(`Storage Engine: ${storageConfig.engine}`);
  console.log(`Default Domain: ${serverConfig.defaultDomain}`);
  console.log(`Port: ${serverConfig.port}`);
  
  // Create storage engine
  const storage = createStorageEngine(storageConfig);
  
  // Initialize storage
  await storage.initialize();
  console.log('Storage initialized successfully');
  
  // Create Express app
  const app = express();
  
  // Add response time tracking
  app.use((_req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', duration.toString());
      return originalSend.call(this, data);
    };
    next();
  });
  
  // Add logging middleware
  if (serverConfig.enableLogging) {
    app.use(createLoggingMiddleware(serverConfig.debugMode));
  }
  
  // Add archive routes
  const archiveRouter = createArchiveRouter(storage, serverConfig.defaultDomain);
  app.use('/', archiveRouter);
  
  // 404 handler (must be after all routes)
  app.use(notFoundHandler);
  
  // Error handler (must be last)
  app.use(errorHandler);
  
  // Start server
  app.listen(serverConfig.port, serverConfig.host, () => {
    console.log(`\n✨ Archive Viewer Server is running!`);
    console.log(`📁 Serving archives for: ${serverConfig.defaultDomain}`);
    console.log(`🌐 Access at: http://${serverConfig.host}:${serverConfig.port}`);
    console.log(`💾 Storage: ${storageConfig.engine}`);
    if (storageConfig.engine === 's3' && storageConfig.s3) {
      console.log(`🪣 S3 Bucket: ${storageConfig.s3.bucket}`);
    }
    console.log('\nPress Ctrl+C to stop the server\n');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down server...');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});