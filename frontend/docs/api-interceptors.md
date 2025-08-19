# API Interceptors Documentation

This document describes the API interceptors available in the frontend application for development and testing purposes.

## Request/Response Logging

The logging interceptor provides detailed request and response logging for debugging API interactions during development.

### Features

- **Request Logging**: Logs method, URL, headers, and body
- **Response Logging**: Logs status, headers, body, and duration
- **Error Logging**: Captures and logs network errors with stack traces
- **Sensitive Data Masking**: Automatically masks authorization tokens and secrets
- **Body Truncation**: Prevents excessive logging of large payloads
- **Configurable**: Fine-grained control over what gets logged

### Usage

```typescript
import { fetchWithLogging, configureApiLogging } from '@/api/interceptors/logging.interceptor';

// Basic usage
const response = await fetchWithLogging('/api/users');

// Configure logging options
configureApiLogging({
  enabled: true, // Enable/disable logging
  logRequests: true, // Log outgoing requests
  logResponses: true, // Log incoming responses
  logErrors: true, // Log errors
  logDuration: true, // Log request duration
  logHeaders: false, // Log headers (disabled by default for security)
  logBody: true, // Log request/response bodies
  maxBodyLength: 1000, // Maximum body length before truncation
});
```

### Enhanced API Client

The enhanced API client combines logging with additional features:

```typescript
import { enhancedApiClient } from '@/api/client.enhanced';

// Configure the client
enhancedApiClient.updateConfig({
  logging: true, // Enable logging in development
  networkSimulation: false, // Enable network failure simulation
  retries: 3, // Retry failed requests
  timeout: 30000, // Request timeout in ms
});

// Use the client
const data = await enhancedApiClient.get('/api/users');
const user = await enhancedApiClient.post('/api/users', { name: 'John' });

// Cancel specific requests
enhancedApiClient.cancelRequest('user-fetch');

// Clear all logs
enhancedApiClient.clearLogs();
```

### Log Output Format

Requests are logged with colored emojis for easy identification:

- 🔵 Blue circle for requests
- 🟢 Green circle for successful responses (2xx, 3xx)
- 🔴 Red circle for error responses (4xx, 5xx)

Example output:

```
🔵 POST /api/users
{
  type: 'API_REQUEST',
  requestId: '1234567890-0.123',
  method: 'POST',
  url: 'http://localhost:5000/api/users',
  headers: {
    'Authorization': 'Bearer ***',
    'Content-Type': 'application/json'
  },
  body: '{"name":"John"}',
  timestamp: '2025-01-16T10:30:00.000Z'
}

🟢 POST /api/users (201 - 125ms)
{
  type: 'API_RESPONSE',
  requestId: '1234567890-0.123',
  status: 201,
  statusText: 'Created',
  body: { id: 1, name: 'John' },
  duration: '125ms',
  timestamp: '2025-01-16T10:30:00.125Z'
}
```

## Network Failure Simulation

The network failure simulator helps test application resilience by simulating various network conditions.

### Features

- **Multiple Error Types**: Timeout, connection refused, DNS failure, network unreachable
- **Configurable Failure Rate**: Control how often failures occur
- **Request Delays**: Simulate slow network conditions
- **URL Pattern Matching**: Target specific endpoints for failure simulation
- **Preset Configurations**: Quick setup for common scenarios

### Usage

```typescript
import {
  networkFailureSimulator,
  simulateUnreliableNetwork,
  simulateSlowNetwork,
  simulateOffline,
  simulateFlakyNetwork,
  restoreNetwork,
  NetworkErrorType,
} from '@/api/interceptors/network-failure.interceptor';

// Use preset configurations
simulateUnreliableNetwork(); // 30% failure rate, mixed errors
simulateSlowNetwork(); // Adds 1-3 second delays
simulateOffline(); // 100% failure with network unreachable
simulateFlakyNetwork(); // 10% failure rate with timeout errors

// Custom configuration
networkFailureSimulator.updateConfig({
  enabled: true,
  failureRate: 0.5, // 50% of requests will fail
  minDelay: 100, // Minimum delay in ms
  maxDelay: 500, // Maximum delay in ms
  errorTypes: [NetworkErrorType.TIMEOUT, NetworkErrorType.DNS_FAILURE],
  urlPatterns: [/api\/users/], // Only affect user API calls
  excludePatterns: [/health/], // Never fail health checks
});

// Enable simulation
networkFailureSimulator.enable();

// Disable simulation
networkFailureSimulator.disable();

// Restore original network behavior
restoreNetwork();
```

### Error Types

- `TIMEOUT`: Request timeout error
- `CONNECTION_REFUSED`: Server connection refused
- `DNS_FAILURE`: DNS resolution failed
- `NETWORK_UNREACHABLE`: Network is unreachable
- `SLOW_RESPONSE`: Delayed response (simulates slow network)
- `RANDOM`: Randomly selects from other error types

### Testing with Network Simulation

```typescript
// In your tests
describe('Error Handling', () => {
  beforeEach(() => {
    simulateUnreliableNetwork();
  });

  afterEach(() => {
    restoreNetwork();
  });

  it('should handle network failures gracefully', async () => {
    // Your component should handle failures
    const result = await fetchData();
    expect(result).toHaveProperty('error');
  });

  it('should retry on failure', async () => {
    networkFailureSimulator.updateConfig({
      failureRate: 1, // Always fail first attempt
      errorTypes: [NetworkErrorType.TIMEOUT],
    });

    // After first failure, disable simulation
    setTimeout(() => restoreNetwork(), 100);

    // Component should retry and succeed
    const result = await fetchWithRetry('/api/data');
    expect(result).toBeDefined();
  });
});
```

## Development Tools

### Browser Console Access

In development mode, the API client is exposed to the browser console:

```javascript
// In browser console
__apiClient.updateConfig({ logging: true });
__apiClient.clearLogs();
```

### Integration with Redux DevTools

When using with Redux or other state management, logged requests can be correlated with state changes for easier debugging.

### Performance Monitoring

The logging interceptor tracks request duration, helping identify performance bottlenecks:

```typescript
// Find slow endpoints
configureApiLogging({
  logDuration: true,
  enabled: true,
});

// Logs will show duration for each request
// Example: "GET /api/users (200 - 1250ms)"
```

## Best Practices

1. **Development Only**: Enable logging only in development to avoid performance impact and security risks
2. **Sensitive Data**: Never log sensitive data in production; use header masking
3. **Body Truncation**: Configure appropriate body length limits to avoid console spam
4. **Network Simulation**: Use in development and testing only, never in production
5. **Clean Up**: Always restore network behavior after tests to avoid test pollution

## Security Considerations

- Authorization headers are automatically masked as `Bearer ***`
- Headers containing "token", "secret", or "api-key" are masked
- Logging is disabled by default in production builds
- Request bodies containing passwords should be excluded from logging

## Configuration Examples

### Minimal Logging (Performance)

```typescript
configureApiLogging({
  enabled: true,
  logRequests: true,
  logResponses: false,
  logErrors: true,
  logHeaders: false,
  logBody: false,
});
```

### Debugging Authentication Issues

```typescript
configureApiLogging({
  enabled: true,
  logRequests: true,
  logResponses: true,
  logHeaders: true, // See masked auth headers
  logBody: false,
});
```

### Full Debugging

```typescript
configureApiLogging({
  enabled: true,
  logRequests: true,
  logResponses: true,
  logErrors: true,
  logDuration: true,
  logHeaders: true,
  logBody: true,
  maxBodyLength: 5000,
});
```
