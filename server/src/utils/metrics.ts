import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';
import { systemLogger } from './logger.js';

// Create a custom registry for our metrics
export const metricsRegistry = new Registry();

// Add default labels that will be added to all metrics
metricsRegistry.setDefaultLabels({
  app: 'server',
  environment: process.env.NODE_ENV || 'development',
});

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
collectDefaultMetrics({
  register: metricsRegistry,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // GC duration buckets in seconds
});

// HTTP Metrics (RED - Rate, Errors, Duration)
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], // in seconds
  registers: [metricsRegistry],
});

export const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method', 'route'],
  registers: [metricsRegistry],
});

// Database Metrics
export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [metricsRegistry],
});

export const dbConnectionsIdle = new Gauge({
  name: 'db_connections_idle',
  help: 'Number of idle database connections',
  registers: [metricsRegistry],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5], // in seconds
  registers: [metricsRegistry],
});

// DBOS Workflow Metrics
export const workflowExecutionsTotal = new Counter({
  name: 'workflow_executions_total',
  help: 'Total number of workflow executions',
  labelNames: ['workflow_name', 'status'],
  registers: [metricsRegistry],
});

export const workflowDuration = new Histogram({
  name: 'workflow_duration_seconds',
  help: 'Duration of workflow executions in seconds',
  labelNames: ['workflow_name', 'status'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120, 300], // in seconds
  registers: [metricsRegistry],
});

export const workflowStepsTotal = new Counter({
  name: 'workflow_steps_total',
  help: 'Total number of workflow steps executed',
  labelNames: ['workflow_name', 'step_name', 'status'],
  registers: [metricsRegistry],
});

// Business Metrics
export const businessOperationsTotal = new Counter({
  name: 'business_operations_total',
  help: 'Total number of business operations',
  labelNames: ['operation', 'status'],
  registers: [metricsRegistry],
});

// Helper function to get route pattern from Fastify request
export function getRoutePattern(url: string, routerPath?: string): string {
  // If we have a router path from Fastify, use it
  if (routerPath) {
    return routerPath;
  }

  // Otherwise, try to normalize the URL to a pattern
  // This helps prevent high cardinality issues
  const normalized = url
    .replace(/\/\d+/g, '/:id') // Replace numeric IDs with :id
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs with :uuid
    .split('?')[0]; // Remove query parameters

  return normalized || '/';
}

// Initialize metrics that need starting values
export function initializeMetrics(): void {
  // Set initial database connection metrics to 0
  dbConnectionsActive.set(0);
  dbConnectionsIdle.set(0);

  systemLogger.info('Metrics initialized');
}

// Get metrics in Prometheus format
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

// Get metrics as JSON (useful for debugging)
export async function getMetricsJSON() {
  return metricsRegistry.getMetricsAsJSON();
}

// Get the metrics registry instance
export function getMetricsRegistry(): Registry {
  return metricsRegistry;
}

// Graceful shutdown - useful for cleaning up metrics
export async function shutdownMetrics(): Promise<void> {
  // Clear all metrics to prevent stale data
  metricsRegistry.clear();
  systemLogger.info('Metrics shutdown complete');
}
