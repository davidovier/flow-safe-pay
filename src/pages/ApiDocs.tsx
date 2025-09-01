import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Code, Book, Key, Zap, Shield, Globe, Copy, ExternalLink, CheckCircle, Terminal, FileText, Layers } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function ApiDocs() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const sections = [
    { id: 'overview', title: 'Overview', icon: Book },
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'deals', title: 'Deals', icon: Zap },
    { id: 'payments', title: 'Payments', icon: Shield },
    { id: 'webhooks', title: 'Webhooks', icon: Globe },
    { id: 'errors', title: 'Error Handling', icon: Terminal },
    { id: 'sdks', title: 'SDKs & Libraries', icon: Layers }
  ];

  const codeExamples = {
    auth: `curl -X POST https://api.flowpay.com/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "grant_type": "client_credentials"
  }'`,
    createDeal: `curl -X POST https://api.flowpay.com/v1/deals \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Brand Partnership Campaign",
    "description": "YouTube video promotion",
    "amount": 5000,
    "currency": "USD",
    "creator_id": "creator_123",
    "brand_id": "brand_456",
    "milestones": [
      {
        "title": "Video Creation",
        "description": "Create and deliver video content",
        "amount": 3000,
        "due_date": "2024-12-15"
      },
      {
        "title": "Campaign Report",
        "description": "Provide performance analytics",
        "amount": 2000,
        "due_date": "2024-12-30"
      }
    ]
  }'`,
    webhook: `{
  "event": "deal.milestone.completed",
  "data": {
    "deal_id": "deal_789",
    "milestone_id": "milestone_123",
    "amount": 3000,
    "status": "completed",
    "completed_at": "2024-12-01T15:30:00Z"
  },
  "timestamp": "2024-12-01T15:30:00Z",
  "signature": "sha256=abc123..."
}`
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/v1/deals',
      description: 'Create a new deal between creator and brand',
      auth: true
    },
    {
      method: 'GET',
      path: '/v1/deals/{id}',
      description: 'Retrieve deal details by ID',
      auth: true
    },
    {
      method: 'PUT',
      path: '/v1/deals/{id}',
      description: 'Update deal information',
      auth: true
    },
    {
      method: 'POST',
      path: '/v1/deals/{id}/fund',
      description: 'Fund a deal with escrow payment',
      auth: true
    },
    {
      method: 'POST',
      path: '/v1/deals/{id}/milestones/{milestone_id}/complete',
      description: 'Mark milestone as completed',
      auth: true
    },
    {
      method: 'GET',
      path: '/v1/payments',
      description: 'List all payments for authenticated user',
      auth: true
    },
    {
      method: 'POST',
      path: '/v1/payments/{id}/refund',
      description: 'Request refund for a payment',
      auth: true
    }
  ];

  const errorCodes = [
    { code: 400, name: 'Bad Request', description: 'Invalid request parameters or missing required fields' },
    { code: 401, name: 'Unauthorized', description: 'Invalid or missing authentication token' },
    { code: 403, name: 'Forbidden', description: 'Insufficient permissions for requested action' },
    { code: 404, name: 'Not Found', description: 'Requested resource does not exist' },
    { code: 422, name: 'Unprocessable Entity', description: 'Request validation failed' },
    { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded' },
    { code: 500, name: 'Internal Server Error', description: 'Unexpected server error' }
  ];

  const sdks = [
    {
      name: 'JavaScript/Node.js',
      description: 'Official Node.js SDK with TypeScript support',
      installation: 'npm install @flowpay/sdk',
      example: `const { FlowPayClient } = require('@flowpay/sdk');
const client = new FlowPayClient('your_api_key');`
    },
    {
      name: 'Python',
      description: 'Python SDK with async support',
      installation: 'pip install flowpay',
      example: `from flowpay import FlowPayClient
client = FlowPayClient('your_api_key')`
    },
    {
      name: 'PHP',
      description: 'PHP SDK for server-side integration',
      installation: 'composer require flowpay/php-sdk',
      example: `use FlowPay\\Client;
$client = new Client('your_api_key');`
    }
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getMethodColor = (method: string) => {
    const colors = {
      'GET': 'bg-green-100 text-green-700',
      'POST': 'bg-blue-100 text-blue-700',
      'PUT': 'bg-orange-100 text-orange-700',
      'DELETE': 'bg-red-100 text-red-700'
    };
    return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <SEOHead
        title="API Documentation - FlowPay"
        description="Complete API documentation for FlowPay. Integrate with our platform using REST APIs, webhooks, and SDKs."
        keywords={['API documentation', 'REST API', 'webhooks', 'SDK', 'integration']}
        url="/api-docs"
        type="website"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="text-sm text-gray-600">
                API Version 1.0
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
              <Code className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">API Documentation</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Build powerful integrations with the FlowPay API. Comprehensive documentation, 
              code examples, and SDKs to get you started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Get API Key
              </Button>
              <Button variant="outline" className="border-indigo-200">
                <ExternalLink className="h-4 w-4 mr-2" />
                API Playground
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Documentation</h3>
                    <nav className="space-y-1">
                      {sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeSection === section.id 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <section.icon className="h-4 w-4" />
                          {section.title}
                        </button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">API Overview</h2>
                    <p className="text-gray-600 mb-6">
                      The FlowPay API is a RESTful API that allows you to integrate FlowPay's 
                      escrow and payment services into your applications. Our API is designed 
                      to be simple, secure, and developer-friendly.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">Base URL</h3>
                      <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                        https://api.flowpay.com
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Secure</h3>
                        <p className="text-sm text-gray-600">
                          All API calls are secured with HTTPS and require authentication
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Zap className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Fast</h3>
                        <p className="text-sm text-gray-600">
                          Low latency responses with 99.9% uptime guarantee
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Code className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">RESTful</h3>
                        <p className="text-sm text-gray-600">
                          Standard HTTP methods and status codes for easy integration
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Authentication Section */}
              {activeSection === 'authentication' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Authentication</h2>
                    <p className="text-gray-600 mb-6">
                      FlowPay uses API keys to authenticate requests. You can generate API keys 
                      from your dashboard. Include your API key in the Authorization header.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Get Access Token</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(codeExamples.auth, 'auth')}
                        >
                          {copiedCode === 'auth' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{codeExamples.auth}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Using the Token</h3>
                      <p className="text-gray-600 mb-4">
                        Include the access token in the Authorization header of your requests:
                      </p>
                      <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                        Authorization: Bearer YOUR_ACCESS_TOKEN
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Deals Section */}
              {activeSection === 'deals' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Deals API</h2>
                    <p className="text-gray-600 mb-6">
                      Create and manage deals between creators and brands. Deals represent 
                      the contract and escrow arrangement for sponsored content.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Create Deal</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(codeExamples.createDeal, 'createDeal')}
                        >
                          {copiedCode === 'createDeal' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{codeExamples.createDeal}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Deal Endpoints</h3>
                      <div className="space-y-3">
                        {endpoints.filter(endpoint => endpoint.path.includes('/deals')).map((endpoint, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono">{endpoint.path}</code>
                            </div>
                            <p className="text-sm text-gray-600">{endpoint.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Payments Section */}
              {activeSection === 'payments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Payments API</h2>
                    <p className="text-gray-600 mb-6">
                      Handle payments, refunds, and escrow operations. All payments are 
                      processed securely through our payment partners.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Payment Endpoints</h3>
                      <div className="space-y-3">
                        {endpoints.filter(endpoint => endpoint.path.includes('/payments')).map((endpoint, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                                {endpoint.method}
                              </span>
                              <code className="text-sm font-mono">{endpoint.path}</code>
                            </div>
                            <p className="text-sm text-gray-600">{endpoint.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Webhooks Section */}
              {activeSection === 'webhooks' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Webhooks</h2>
                    <p className="text-gray-600 mb-6">
                      Receive real-time notifications about deal status changes, payments, 
                      and other events in your FlowPay account.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Webhook Payload Example</h3>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(codeExamples.webhook, 'webhook')}
                        >
                          {copiedCode === 'webhook' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{codeExamples.webhook}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Webhook Events</h3>
                      <div className="space-y-2">
                        {[
                          'deal.created',
                          'deal.funded',
                          'deal.milestone.completed',
                          'deal.completed',
                          'payment.succeeded',
                          'payment.failed',
                          'refund.processed'
                        ].map((event) => (
                          <div key={event} className="flex items-center gap-2 p-2 border rounded">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{event}</code>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Error Handling Section */}
              {activeSection === 'errors' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
                    <p className="text-gray-600 mb-6">
                      FlowPay uses standard HTTP response codes to indicate success or failure. 
                      Error responses include details to help you debug issues.
                    </p>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">HTTP Status Codes</h3>
                      <div className="space-y-3">
                        {errorCodes.map((error) => (
                          <div key={error.code} className="flex items-start gap-4 p-3 border rounded-lg">
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-mono">
                              {error.code}
                            </span>
                            <div>
                              <h4 className="font-medium">{error.name}</h4>
                              <p className="text-sm text-gray-600">{error.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SDKs Section */}
              {activeSection === 'sdks' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">SDKs & Libraries</h2>
                    <p className="text-gray-600 mb-6">
                      Get started quickly with our official SDKs and community libraries 
                      for popular programming languages.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {sdks.map((sdk, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-2">{sdk.name}</h3>
                          <p className="text-gray-600 mb-4">{sdk.description}</p>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-2">Installation</h4>
                              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                                {sdk.installation}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Usage</h4>
                              <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                                <pre className="text-sm">
                                  <code>{sdk.example}</code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Ready to Build?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Start integrating with FlowPay today. Get your API keys and explore 
                  our interactive playground to test endpoints.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Get API Keys
                  </Button>
                  <Button variant="outline" className="border-indigo-200">
                    Try API Playground
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}