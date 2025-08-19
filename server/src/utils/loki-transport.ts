/**
 * Custom Loki transport for Pino that sends logs directly via HTTP
 * Works around pino-loki and Pino v9.x transport level filtering bugs
 */

import build from 'pino-abstract-transport';

interface LokiTransportOptions {
  host: string;
  labels?: Record<string, string>;
  interval?: number;
  batchSize?: number;
  minLevel?: number; // Minimum log level to send (default: 30 = info)
}

interface LogEntry {
  stream: Record<string, string>;
  values: Array<[string, string]>;
}

export default async function lokiTransport(options: LokiTransportOptions) {
  console.log('[Loki Transport] Initializing with options:', options);

  const {
    host = 'http://loki:3100',
    labels = {},
    interval = 2000,
    batchSize = 50,
    minLevel = 30, // Default to info level (30)
  } = options;

  const batch: LogEntry = {
    stream: {
      ...labels,
      app: labels.app || 'server',
      environment: labels.environment || 'development',
    },
    values: [],
  };

  // Send batch to Loki
  const sendBatch = async () => {
    if (batch.values.length === 0) {
      return;
    }

    const payload = {
      streams: [batch],
    };

    try {
      // Use dynamic import for node-fetch
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${host}/loki/api/v1/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Loki Transport] Failed to send logs: ${response.status} - ${text}`);
      } else {
        console.debug(`[Loki Transport] Sent ${batch.values.length} logs to Loki`);
      }
    } catch (error) {
      console.error('[Loki Transport] Error sending logs:', error);
    }

    // Clear batch
    batch.values = [];
  };

  // Set up interval for batch sending
  const intervalId = setInterval(sendBatch, interval);

  return build(async function (source) {
    for await (const obj of source) {
      // Filter by log level (work around Pino v9.x bug)
      if (obj.level && obj.level < minLevel) {
        continue; // Skip logs below minimum level
      }

      // Convert log object to Loki format
      const timestamp = (Date.now() * 1000000).toString(); // nanoseconds
      const logLine = JSON.stringify(obj);

      batch.values.push([timestamp, logLine]);

      // Send immediately if batch is full
      if (batch.values.length >= batchSize) {
        await sendBatch();
      }
    }

    // Clean up on shutdown
    clearInterval(intervalId);
    await sendBatch(); // Send any remaining logs
  });
}
