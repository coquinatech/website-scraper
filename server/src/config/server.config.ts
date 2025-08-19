export const serverConfig = {
  port: parseInt(process.env['PORT'] ?? '5000', 10),
  host: process.env['HOST'] ?? '0.0.0.0',
  nodeEnv: process.env['NODE_ENV'] || 'development',
  corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
};