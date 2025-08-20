import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version?: string;
  environment?: string;
}

interface Metric {
  name: string;
  value: string;
  type: string;
}

export function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Fetch health status
      const healthData = await apiClient.getHealth();
      setHealth(healthData);

      // Fetch metrics
      const metricsText = await apiClient.getMetrics();
      const parsedMetrics = parseMetrics(metricsText);
      setMetrics(parsedMetrics);

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const parseMetrics = (metricsText: string): Metric[] => {
    const lines = metricsText.split('\n');
    const metrics: Metric[] = [];
    
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      
      const match = line.match(/^([^{]+)({[^}]+})?\s+(.+)$/);
      if (match) {
        metrics.push({
          name: match[1] || '',
          value: match[3] || '',
          type: 'gauge' as const
        });
      }
    }
    
    return metrics.slice(0, 10); // Show first 10 metrics
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>

      {/* Health Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Status</h2>
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard 
              label="Status" 
              value={health.status} 
              color={health.status === 'ok' ? 'green' : 'red'} 
            />
            <StatusCard 
              label="Uptime" 
              value={formatUptime(health.uptime)} 
              color="blue" 
            />
            <StatusCard 
              label="Version" 
              value={health.version || 'N/A'} 
              color="gray" 
            />
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h2>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="flex justify-between py-2 border-b">
              <span className="text-sm text-gray-600">{metric.name}</span>
              <span className="text-sm font-mono text-gray-900">{metric.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Observability Links */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Observability Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ObservabilityLink 
            href="http://grafana:3000" 
            title="Grafana"
            description="Dashboards and visualization"
          />
          <ObservabilityLink 
            href="http://localhost:5000/metrics" 
            title="Prometheus Metrics"
            description="Raw metrics endpoint"
          />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ObservabilityLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </a>
  );
}