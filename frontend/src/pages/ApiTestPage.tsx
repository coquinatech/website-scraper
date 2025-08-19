import { useState } from 'react';
import { apiClient } from '../services/api';

interface ApiResponse {
  data: any;
  status: number;
  timestamp: string;
}

export function ApiTestPage() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: 'Test Item',
    value: 100
  });
  const [loginData, setLoginData] = useState({
    username: 'demo',
    password: 'password123'
  });

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let result;
      const timestamp = new Date().toISOString();

      switch (endpoint) {
        case 'health':
          result = await apiClient.getHealth();
          break;
        case 'example':
          result = await apiClient.getExample();
          break;
        case 'example-post':
          result = await apiClient.createExample(data);
          break;
        case 'login':
          result = await apiClient.login('demo@example.com', 'password123');
          break;
        case 'error':
          result = await apiClient.testError();
          break;
        default:
          throw new Error('Unknown endpoint');
      }

      setResponse({
        data: result,
        status: 200,
        timestamp
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">API Test Console</h1>

      {/* Test Buttons */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Endpoints</h2>
        
        <div className="space-y-4">
          {/* GET Endpoints */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">GET Endpoints</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => testEndpoint('health')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                GET /health
              </button>
              <button
                onClick={() => testEndpoint('example')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                GET /api/example
              </button>
              <button
                onClick={() => testEndpoint('error')}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                GET /api/example/error
              </button>
            </div>
          </div>

          {/* POST Example */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">POST /api/example</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 border rounded"
              />
              <input
                type="number"
                placeholder="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="px-3 py-2 border rounded"
              />
              <button
                onClick={() => testEndpoint('example-post', 'POST', formData)}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Send POST
              </button>
            </div>
          </div>

          {/* Login Test */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">POST /api/auth/login</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="px-3 py-2 border rounded"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="px-3 py-2 border rounded"
              />
              <button
                onClick={() => testEndpoint('login', 'POST', loginData)}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Test Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Response Display */}
      {(response || error) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response</h2>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          ) : response ? (
            <div>
              <div className="mb-2 text-sm text-gray-600">
                Status: <span className="font-semibold">{response.status}</span> | 
                Time: <span className="font-semibold">{response.timestamp}</span>
              </div>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
}