import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions/incubating';

const serviceName = process.env.OTEL_SERVICE_NAME || 'server';
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const otlpEndpoint = process.env.OTEL_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces';

export function initializeTracing(): NodeSDK {
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || 'development',
  });

  const traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: {},
  });

  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      new HttpInstrumentation({
        requestHook: (span, request) => {
          if ('headers' in request) {
            span.setAttributes({
              'http.request.body.size': request.headers?.['content-length'] || 0,
            });
          }
        },
        responseHook: (span, response) => {
          const statusCode = response.statusCode || 0;
          if (statusCode >= 400) {
            span.setStatus({ code: SpanStatusCode.ERROR });
          }
        },
        // @ts-ignore - ignoreIncomingPaths may not be in type definition
        ignoreIncomingPaths: ['/health', '/metrics'],
      }),
      new FastifyInstrumentation({
        requestHook: (span, info) => {
          span.setAttributes({
            'fastify.route': info.request.routerPath,
            'fastify.method': info.request.routerMethod,
          });
        },
      }),
      new PgInstrumentation({
        enhancedDatabaseReporting: true,
        responseHook: (span, responseInfo) => {
          span.setAttributes({
            'db.rows_affected': responseInfo.data?.rowCount || 0,
          });
        },
      }),
    ],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

export function getTracer(name = serviceName) {
  return trace.getTracer(name, serviceVersion);
}

export function createSpan(name: string, fn: () => Promise<any>) {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function getCurrentTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    return spanContext.traceId;
  }
  return undefined;
}

export function addSpanAttributes(attributes: Record<string, any>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

export { context, trace };

