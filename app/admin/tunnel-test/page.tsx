'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Navigation from '../../components/Navigation';

interface TestResult {
  success: boolean;
  status: number;
  statusText: string;
  responseTime: number;
  headers?: Record<string, string>;
  data?: string | Record<string, unknown>;
  error?: string;
  errorType?: string;
}

export default function TunnelTestPage() {
  const { isLoaded, userId } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [customPayload, setCustomPayload] = useState('{"test": true, "message": "ping"}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Parse custom payload
      let testPayload;
      try {
        testPayload = JSON.parse(customPayload);
      } catch {
        setError('Invalid JSON in custom payload');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/tunnel-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookUrl,
          testPayload,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to test connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0f1015]">
        <Navigation />
        <div className="p-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-white">
            <h2 className="font-semibold">Access Denied</h2>
            <p className="text-red-300">Please sign in to access admin features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1015]">
      <Navigation />

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-[#11121b] rounded-xl border border-white/10 p-6">
          <div className="border-b border-white/10 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-white">N8N Tunnel Connection Test</h1>
            <p className="text-neutral-400 mt-2">
              Test your reverse tunnel connection to N8N before enabling AI features.
              This will send a test request to your webhook URL and display the response.
            </p>
          </div>

          {/* Test Form */}
          <form onSubmit={handleTest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-tunnel-domain.com/webhook/test"
                className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                required
                disabled={loading}
              />
              <p className="text-xs text-neutral-400 mt-1">
                Enter the full URL of your N8N webhook endpoint through your reverse tunnel
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Test Payload (JSON)
              </label>
              <textarea
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none font-mono text-sm h-24"
                disabled={loading}
              />
              <p className="text-xs text-neutral-400 mt-1">
                JSON data to send in the test request body
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !webhookUrl}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing Connection...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Test Connection
                </>
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-200 font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Error
              </h3>
              <p className="text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 space-y-4">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${
                result.success
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {result.success ? (
                      <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    <div>
                      <h3 className={`font-semibold ${result.success ? 'text-green-200' : 'text-yellow-200'}`}>
                        {result.success ? 'Connection Successful!' : 'Connection Made (with error response)'}
                      </h3>
                      <p className={`text-sm ${result.success ? 'text-green-300' : 'text-yellow-300'}`}>
                        Status: {result.status} {result.statusText}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${result.success ? 'text-green-200' : 'text-yellow-200'}`}>
                      {result.responseTime}ms
                    </div>
                    <div className={`text-xs ${result.success ? 'text-green-400' : 'text-yellow-400'}`}>
                      Response Time
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Error Details */}
              {result.error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-200 font-semibold mb-2">Connection Error</h4>
                  <p className="text-red-300 text-sm font-mono">{result.error}</p>
                  {result.errorType && (
                    <p className="text-red-400 text-xs mt-1">Error Type: {result.errorType}</p>
                  )}
                </div>
              )}

              {/* Response Data */}
              {result.data !== undefined && (
                <div className="bg-[#18192a] border border-white/10 rounded-lg p-4">
                  <h4 className="text-neutral-200 font-semibold mb-2">Response Data</h4>
                  <pre className="text-neutral-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap bg-[#0f1015] rounded-lg p-3">
                    {typeof result.data === 'string'
                      ? result.data
                      : JSON.stringify(result.data, null, 2)
                    }
                  </pre>
                </div>
              )}

              {/* Response Headers */}
              {result.headers && Object.keys(result.headers).length > 0 && (
                <details className="bg-[#18192a] border border-white/10 rounded-lg">
                  <summary className="p-4 text-neutral-200 font-semibold cursor-pointer hover:bg-white/5">
                    Response Headers ({Object.keys(result.headers).length})
                  </summary>
                  <div className="px-4 pb-4">
                    <pre className="text-neutral-400 text-xs font-mono overflow-x-auto bg-[#0f1015] rounded-lg p-3">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-blue-200 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How This Works
            </h3>
            <div className="text-blue-300 text-sm mt-2 space-y-1">
              <p>1. Your N8N instance runs on your home network with Gemini CLI access</p>
              <p>2. A reverse tunnel (like ngrok, Cloudflare Tunnel, or similar) exposes the webhook</p>
              <p>3. This test page verifies the connection works over the internet</p>
              <p>4. Even error responses are useful - they confirm the server received our request</p>
            </div>
          </div>

          {/* Expected N8N Setup */}
          <div className="mt-4 bg-[#18192a] border border-white/10 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-200 mb-2">Expected N8N Webhook Response</h3>
            <pre className="text-neutral-400 text-sm font-mono bg-[#0f1015] rounded-lg p-3">
{`{
  "message": "Generated content here..."
}`}
            </pre>
            <p className="text-xs text-neutral-400 mt-2">
              For the full AI integration, your N8N workflow should accept a <code className="bg-[#0f1015] px-1 rounded">prompt</code> field
              and return the generated message in this format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
