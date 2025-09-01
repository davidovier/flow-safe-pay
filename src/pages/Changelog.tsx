import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, Tag, Zap, Bug, Shield, Sparkles, ArrowRight, ExternalLink, Star, Bell } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Changelog() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const changeTypes = {
    feature: { label: 'New Feature', color: 'bg-green-100 text-green-700 border-green-200', icon: Sparkles },
    improvement: { label: 'Improvement', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Zap },
    bugfix: { label: 'Bug Fix', color: 'bg-red-100 text-red-700 border-red-200', icon: Bug },
    security: { label: 'Security', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield }
  };

  const releases = [
    {
      version: '2.1.0',
      date: '2024-12-01',
      title: 'Enhanced Creator Dashboard & Mobile App',
      description: 'Major dashboard improvements with real-time notifications and mobile app launch.',
      changes: [
        {
          type: 'feature',
          title: 'Mobile App Launch',
          description: 'FlowPay is now available on iOS and Android with full feature parity.',
          impact: 'High'
        },
        {
          type: 'feature',
          title: 'Real-time Notifications',
          description: 'Get instant push notifications for deal updates, payments, and milestones.',
          impact: 'High'
        },
        {
          type: 'improvement',
          title: 'Enhanced Creator Dashboard',
          description: 'Redesigned dashboard with better analytics and performance metrics.',
          impact: 'Medium'
        },
        {
          type: 'improvement',
          title: 'Faster Payment Processing',
          description: 'Reduced payment processing time by 40% with improved Stripe integration.',
          impact: 'Medium'
        },
        {
          type: 'bugfix',
          title: 'Fixed Email Notification Issues',
          description: 'Resolved issues with delayed email notifications for milestone completions.',
          impact: 'Low'
        }
      ],
      isStarred: true
    },
    {
      version: '2.0.5',
      date: '2024-11-15',
      title: 'Security & Performance Updates',
      description: 'Important security patches and performance optimizations.',
      changes: [
        {
          type: 'security',
          title: 'Enhanced Two-Factor Authentication',
          description: 'Improved 2FA with support for authenticator apps and backup codes.',
          impact: 'High'
        },
        {
          type: 'security',
          title: 'API Security Improvements',
          description: 'Strengthened API authentication and rate limiting mechanisms.',
          impact: 'Medium'
        },
        {
          type: 'improvement',
          title: 'Database Performance',
          description: 'Optimized database queries reducing page load times by 25%.',
          impact: 'Medium'
        },
        {
          type: 'bugfix',
          title: 'Fixed Deal Creation Edge Cases',
          description: 'Resolved issues when creating deals with multiple milestones.',
          impact: 'Low'
        }
      ]
    },
    {
      version: '2.0.0',
      date: '2024-11-01',
      title: 'FlowPay 2.0: Complete Platform Redesign',
      description: 'Major platform update with new design, features, and improved user experience.',
      changes: [
        {
          type: 'feature',
          title: 'Brand New UI Design',
          description: 'Complete visual redesign with improved accessibility and modern interface.',
          impact: 'High'
        },
        {
          type: 'feature',
          title: 'Advanced Analytics Suite',
          description: 'Comprehensive analytics dashboard for tracking deal performance and ROI.',
          impact: 'High'
        },
        {
          type: 'feature',
          title: 'Multi-Currency Support',
          description: 'Support for 15+ currencies with automatic conversion and local pricing.',
          impact: 'High'
        },
        {
          type: 'feature',
          title: 'Team Collaboration Tools',
          description: 'Invite team members and collaborate on deals with role-based permissions.',
          impact: 'Medium'
        },
        {
          type: 'improvement',
          title: 'Enhanced Search & Filtering',
          description: 'Powerful search capabilities across deals, creators, and transactions.',
          impact: 'Medium'
        }
      ],
      isStarred: true
    },
    {
      version: '1.9.2',
      date: '2024-10-20',
      title: 'Bug Fixes & Stability Improvements',
      description: 'Various bug fixes and platform stability improvements.',
      changes: [
        {
          type: 'bugfix',
          title: 'Fixed Milestone Auto-Release',
          description: 'Corrected issue where milestones would not auto-release after approval period.',
          impact: 'High'
        },
        {
          type: 'bugfix',
          title: 'Resolved Payment Webhook Delays',
          description: 'Fixed delays in processing Stripe webhook notifications.',
          impact: 'Medium'
        },
        {
          type: 'improvement',
          title: 'Improved Error Messages',
          description: 'More descriptive error messages throughout the application.',
          impact: 'Low'
        }
      ]
    },
    {
      version: '1.9.0',
      date: '2024-10-01',
      title: 'API v2 & Webhook Improvements',
      description: 'Major API update with improved webhooks and integration capabilities.',
      changes: [
        {
          type: 'feature',
          title: 'API v2 Release',
          description: 'New REST API with improved performance and additional endpoints.',
          impact: 'High'
        },
        {
          type: 'feature',
          title: 'Enhanced Webhook System',
          description: 'More reliable webhooks with retry logic and better error handling.',
          impact: 'Medium'
        },
        {
          type: 'feature',
          title: 'Bulk Operations Support',
          description: 'Process multiple deals and payments through batch API endpoints.',
          impact: 'Medium'
        },
        {
          type: 'improvement',
          title: 'API Documentation Overhaul',
          description: 'Complete rewrite of API documentation with interactive examples.',
          impact: 'Low'
        }
      ]
    },
    {
      version: '1.8.1',
      date: '2024-09-15',
      title: 'Creator Onboarding Improvements',
      description: 'Streamlined creator onboarding process and KYC improvements.',
      changes: [
        {
          type: 'improvement',
          title: 'Simplified KYC Process',
          description: 'Reduced KYC approval time from 5 days to 24 hours.',
          impact: 'High'
        },
        {
          type: 'improvement',
          title: 'Enhanced Onboarding Flow',
          description: 'Step-by-step guided onboarding for new creators and brands.',
          impact: 'Medium'
        },
        {
          type: 'feature',
          title: 'Profile Verification Badges',
          description: 'Visual verification badges for completed profiles and KYC status.',
          impact: 'Low'
        }
      ]
    }
  ];

  const filteredReleases = filter === 'all' ? releases : releases.filter(release => 
    release.changes.some(change => change.type === filter)
  );

  const getChangeIcon = (type: keyof typeof changeTypes) => {
    const IconComponent = changeTypes[type].icon;
    return <IconComponent className="h-4 w-4" />;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <SEOHead
        title="Changelog - FlowPay"
        description="Stay up to date with the latest FlowPay features, improvements, and bug fixes. See what's new in our platform updates."
        keywords={['changelog', 'updates', 'new features', 'bug fixes', 'improvements']}
        url="/changelog"
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
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/rss-changelog.xml')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  RSS Feed
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Changelog</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Stay up to date with the latest features, improvements, and fixes to FlowPay. 
              We ship new updates regularly to make your creator business more successful.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Bell className="h-4 w-4 mr-2" />
                Get Notified of Updates
              </Button>
              <Button variant="outline" onClick={() => navigate('/api-docs')} className="border-blue-200">
                <Tag className="h-4 w-4 mr-2" />
                View API Changes
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center bg-white p-2 rounded-2xl shadow-sm">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                All Updates
              </button>
              {Object.entries(changeTypes).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {filter === type ? (
                    <config.icon className="h-4 w-4" />
                  ) : (
                    <config.icon className="h-4 w-4" />
                  )}
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Releases */}
          <div className="max-w-4xl mx-auto space-y-8">
            {filteredReleases.map((release, index) => (
              <Card key={release.version} className="overflow-hidden">
                <CardContent className="p-8">
                  {/* Release Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Tag className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">v{release.version}</h2>
                            {release.isStarred && (
                              <Star className="h-5 w-5 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-gray-500">{new Date(release.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {release.changes.length} changes
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">{release.title}</h3>
                    <p className="text-gray-600">{release.description}</p>
                  </div>

                  {/* Changes List */}
                  <div className="space-y-4">
                    {release.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${changeTypes[change.type as keyof typeof changeTypes].color}`}>
                            {getChangeIcon(change.type as keyof typeof changeTypes)}
                            {changeTypes[change.type as keyof typeof changeTypes].label}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{change.title}</h4>
                          <p className="text-gray-600 text-sm">{change.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(change.impact)}`}>
                            {change.impact} Impact
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscribe CTA */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Never Miss an Update</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Subscribe to our changelog to get notified when we ship new features, 
                  improvements, and important fixes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Subscribe
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/rss-changelog.xml')}
                    className="border-blue-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    RSS Feed
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/api-docs')}
                    className="border-blue-200"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    API Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Archive Notice */}
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Looking for older releases? 
              <button className="text-blue-600 hover:text-blue-700 ml-1 underline">
                View full changelog archive
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}