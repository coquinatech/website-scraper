export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment?: string;
  version?: string;
  dbos?: {
    status: 'healthy' | 'unhealthy';
    launched: boolean;
    config: {
      name: string;
    };
  };
}
