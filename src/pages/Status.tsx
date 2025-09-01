import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Activity, CheckCircle, AlertCircle, XCircle, Clock, Server, Database, Zap, Shield, Globe, Bell, Calendar, ExternalLink } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Status() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const overallStatus = 'operational'; // operational, degraded, major-outage

  const services = [
    {
      name: 'API Services',
      icon: Server,
      status: 'operational',
      description: 'Core API endpoints and authentication',
      uptime: '99.98%',
      responseTime: '125ms'
    },
    {
      name: 'Payment Processing',
      icon: Zap,
      status: 'operational',
      description: 'Stripe integration and transaction processing',
      uptime: '99.99%',
      responseTime: '89ms'
    },
    {
      name: 'Database',
      icon: Database,
      status: 'operational',
      description: 'Primary database and data replication',
      uptime: '100%',
      responseTime: '45ms'
    },
    {
      name: 'Web Application',
      icon: Globe,
      status: 'operational',
      description: 'Frontend application and CDN delivery',
      uptime: '99.95%',
      responseTime: '210ms'
    },
    {
      name: 'Email Services',
      icon: Bell,
      status: 'degraded',
      description: 'Email notifications and communications',
      uptime: '98.5%',
      responseTime: '1.2s'
    },
    {
      name: 'Security Services',
      icon: Shield,
      status: 'operational',
      description: 'Authentication and security monitoring',
      uptime: '99.97%',
      responseTime: '156ms'
    }
  ];

  const incidents = [
    {
      id: 1,
      title: 'Email Delivery Delays',
      status: 'investigating',
      severity: 'minor',
      startTime: new Date('2024-12-01T14:30:00'),
      description: 'Some users may experience delays in receiving email notifications.',
      updates: [
        {
          time: new Date('2024-12-01T15:15:00'),
          status: 'investigating',
          message: 'We are investigating reports of delayed email notifications and working to resolve the issue.'
        },
        {
          time: new Date('2024-12-01T14:45:00'),
          status: 'identified',
          message: 'We have identified the issue with our email service provider and are working on a resolution.'
        }
      ]
    },
    {
      id: 2,
      title: 'Scheduled Maintenance - Database Migration',
      status: 'scheduled',
      severity: 'maintenance',
      startTime: new Date('2024-12-02T02:00:00'),
      endTime: new Date('2024-12-02T04:00:00'),
      description: 'Scheduled maintenance for database performance improvements.',
      updates: [
        {
          time: new Date('2024-11-28T10:00:00'),
          status: 'scheduled',
          message: 'Scheduled maintenance window for database optimization. Brief service interruptions may occur.'
        }
      ]
    }
  ];

  const statusHistory = [
    { date: '2024-12-01', uptime: 99.2, incidents: 1 },
    { date: '2024-11-30', uptime: 100, incidents: 0 },
    { date: '2024-11-29', uptime: 100, incidents: 0 },
    { date: '2024-11-28', uptime: 100, incidents: 0 },
    { date: '2024-11-27', uptime: 99.8, incidents: 0 },
    { date: '2024-11-26', uptime: 100, incidents: 0 },
    { date: '2024-11-25', uptime: 100, incidents: 0 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'major-outage':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4" />;
      case 'major-outage':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'major':
        return 'bg-orange-100 text-orange-700';
      case 'minor':
        return 'bg-yellow-100 text-yellow-700';
      case 'maintenance':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600';
      case 'investigating':
        return 'text-orange-600';
      case 'identified':
        return 'text-blue-600';
      case 'monitoring':
        return 'text-purple-600';
      case 'scheduled':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <>
      <SEOHead
        title="System Status - FlowPay"
        description="Real-time system status and uptime monitoring for FlowPay services. Check current service health and incident reports."
        keywords={['system status', 'uptime', 'service health', 'incidents', 'monitoring']}
        url="/status"
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
                Last updated: {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
              <Activity className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">System Status</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Real-time status and performance monitoring for all FlowPay services
            </p>
          </div>

          {/* Overall Status */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className={`border-2 ${overallStatus === 'operational' ? 'border-green-200 bg-green-50' : overallStatus === 'degraded' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  {getStatusIcon(overallStatus)}
                  <h2 className="text-2xl font-semibold">
                    {overallStatus === 'operational' ? 'All Systems Operational' : 
                     overallStatus === 'degraded' ? 'Some Systems Degraded' : 
                     'Major Service Disruption'}
                  </h2>
                </div>
                <p className="text-gray-600 mb-4">
                  {overallStatus === 'operational' ? 
                    'All FlowPay services are running smoothly.' :
                    overallStatus === 'degraded' ?
                    'Some services are experiencing issues. We are working to resolve them.' :
                    'We are experiencing major service disruptions and are working to restore services.'}
                </p>
                <div className="text-sm text-gray-500">
                  Current uptime: 99.98% • Response time: 145ms avg
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services Status */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Service Status</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <service.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                        {service.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Uptime</div>
                        <div className="font-medium">{service.uptime}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Response</div>
                        <div className="font-medium">{service.responseTime}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Incidents */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Current Incidents</h2>
            {incidents.length > 0 ? (
              <div className="space-y-6">
                {incidents.map((incident) => (
                  <Card key={incident.id}>
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{incident.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{incident.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Started: {formatDate(incident.startTime)}</span>
                            {incident.endTime && (
                              <span>Ends: {formatDate(incident.endTime)}</span>
                            )}
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getIncidentStatusColor(incident.status)}`}>
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                          {incident.status}
                        </span>
                      </div>
                      
                      {incident.updates.length > 0 && (
                        <div className="border-t pt-6">
                          <h4 className="font-semibold mb-4">Updates</h4>
                          <div className="space-y-4">
                            {incident.updates.map((update, updateIndex) => (
                              <div key={updateIndex} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  {updateIndex < incident.updates.length - 1 && (
                                    <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {formatDate(update.time)}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getIncidentStatusColor(update.status)}`}>
                                      {update.status}
                                    </span>
                                  </div>
                                  <p className="text-gray-600">{update.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Incidents</h3>
                  <p className="text-gray-600">All systems are operating normally.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Status History */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">7-Day Status History</h2>
            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {statusHistory.map((day, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <span className="text-gray-500">Uptime: </span>
                          <span className={`font-medium ${day.uptime === 100 ? 'text-green-600' : day.uptime > 99 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {day.uptime}%
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Incidents: </span>
                          <span className="font-medium">{day.incidents}</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${day.uptime === 100 ? 'bg-green-500' : day.uptime > 99 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscribe to Updates */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Stay Updated</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Subscribe to status updates and get notified of any service disruptions 
                  or scheduled maintenance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Subscribe to Updates
                  </Button>
                  <Button variant="outline" className="border-blue-200">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    RSS Feed
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