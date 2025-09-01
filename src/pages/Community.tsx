import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, MessageCircle, Calendar, Award, TrendingUp, Star, ExternalLink, Twitter, Facebook, Linkedin, Youtube, Heart, Share2, BookOpen } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discussions');

  const communityStats = [
    { label: 'Active Members', value: '12,500+', icon: Users, color: 'blue' },
    { label: 'Monthly Posts', value: '850+', icon: MessageCircle, color: 'green' },
    { label: 'Success Stories', value: '2,100+', icon: Award, color: 'purple' },
    { label: 'Expert Contributors', value: '45', icon: Star, color: 'orange' }
  ];

  const discussions = [
    {
      id: 1,
      title: 'Best practices for creator onboarding',
      author: 'Sarah Chen',
      authorRole: 'Community Expert',
      replies: 23,
      likes: 45,
      category: 'Best Practices',
      timeAgo: '2 hours ago',
      isHot: true
    },
    {
      id: 2,
      title: 'How to handle difficult brand negotiations',
      author: 'Mike Rodriguez',
      authorRole: 'Creator',
      replies: 18,
      likes: 32,
      category: 'Negotiations',
      timeAgo: '4 hours ago',
      isHot: false
    },
    {
      id: 3,
      title: 'Q4 campaign strategies that actually work',
      author: 'Emily Watson',
      authorRole: 'Brand Manager',
      replies: 41,
      likes: 78,
      category: 'Strategy',
      timeAgo: '6 hours ago',
      isHot: true
    }
  ];

  const events = [
    {
      title: 'Creator Economy Summit 2024',
      date: 'Dec 15, 2024',
      time: '2:00 PM PST',
      type: 'Virtual Conference',
      attendees: 450,
      description: 'Join industry leaders to discuss the future of creator marketing'
    },
    {
      title: 'Brand Partnership Workshop',
      date: 'Dec 18, 2024',
      time: '11:00 AM PST',
      type: 'Workshop',
      attendees: 85,
      description: 'Learn how to structure successful long-term partnerships'
    },
    {
      title: 'FlowPay Product Demo & Q&A',
      date: 'Dec 22, 2024',
      time: '3:00 PM PST',
      type: 'Demo',
      attendees: 120,
      description: 'Get hands-on with new features and ask our team questions'
    }
  ];

  const successStories = [
    {
      name: 'Alex Johnson',
      role: 'Tech Reviewer',
      story: 'FlowPay helped me secure my first six-figure brand deal. The escrow protection gave both parties confidence.',
      earnings: '$125,000',
      campaigns: 15,
      avatar: '👨‍💻'
    },
    {
      name: 'Maya Patel',
      role: 'Fashion Influencer',
      story: 'The platform streamlined my workflow with brands. No more chasing payments or unclear terms.',
      earnings: '$85,000',
      campaigns: 23,
      avatar: '👩‍🎨'
    },
    {
      name: 'David Kim',
      role: 'Gaming Content Creator',
      story: 'Found amazing brand partners through FlowPay\'s network. The community support is incredible.',
      earnings: '$95,000',
      campaigns: 18,
      avatar: '🎮'
    }
  ];

  const resources = [
    {
      title: 'Creator Onboarding Guide',
      description: 'Complete guide to getting started on FlowPay',
      type: 'Guide',
      readTime: '10 min',
      downloads: 1250
    },
    {
      title: 'Brand Partnership Templates',
      description: 'Legal templates and contract examples',
      type: 'Templates',
      readTime: '5 min',
      downloads: 890
    },
    {
      title: 'Negotiation Best Practices',
      description: 'How to negotiate fair rates and terms',
      type: 'Article',
      readTime: '8 min',
      downloads: 2100
    }
  ];

  const getTabClasses = (tabName: string) => 
    `px-6 py-3 rounded-lg font-medium transition-colors ${
      activeTab === tabName 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
    }`;

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      <SEOHead
        title="Community - FlowPay"
        description="Join the FlowPay community of creators and brands. Connect, learn, share experiences, and grow your business together."
        keywords={['community', 'creators', 'brands', 'networking', 'collaboration']}
        url="/community"
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
                Welcome to our community
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Community</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Connect with creators and brands, share experiences, and grow together 
              in the FlowPay community.
            </p>
          </div>

          {/* Community Stats */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {communityStats.map((stat, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${getColorClasses(stat.color)}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center bg-white p-2 rounded-2xl shadow-sm">
              <button 
                onClick={() => setActiveTab('discussions')}
                className={getTabClasses('discussions')}
              >
                Discussions
              </button>
              <button 
                onClick={() => setActiveTab('events')}
                className={getTabClasses('events')}
              >
                Events
              </button>
              <button 
                onClick={() => setActiveTab('stories')}
                className={getTabClasses('stories')}
              >
                Success Stories
              </button>
              <button 
                onClick={() => setActiveTab('resources')}
                className={getTabClasses('resources')}
              >
                Resources
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Recent Discussions</h2>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                </div>
                <div className="space-y-4">
                  {discussions.map((discussion) => (
                    <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors">
                                {discussion.title}
                              </h3>
                              {discussion.isHot && (
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                                  🔥 Hot
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span>{discussion.author} • {discussion.authorRole}</span>
                              <span>{discussion.timeAgo}</span>
                              <span className="bg-gray-100 px-2 py-1 rounded-full">{discussion.category}</span>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                {discussion.replies} replies
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {discussion.likes} likes
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Upcoming Events</h2>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="mb-4">
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                            {event.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {event.date} at {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {event.attendees} attending
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          Register Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Success Stories Tab */}
            {activeTab === 'stories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Success Stories</h2>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Your Story
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {successStories.map((story, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="text-2xl">{story.avatar}</div>
                          <div>
                            <h3 className="font-semibold">{story.name}</h3>
                            <p className="text-sm text-gray-600">{story.role}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 italic">"{story.story}"</p>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <div className="text-2xl font-bold text-green-600">{story.earnings}</div>
                            <div className="text-xs text-gray-500">Total Earnings</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{story.campaigns}</div>
                            <div className="text-xs text-gray-500">Campaigns</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Community Resources</h2>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Contribute Resource
                  </Button>
                </div>
                <div className="space-y-4">
                  {resources.map((resource, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold hover:text-indigo-600 transition-colors">
                                {resource.title}
                              </h3>
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                {resource.type}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{resource.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{resource.readTime} read</span>
                              <span>{resource.downloads} downloads</span>
                            </div>
                          </div>
                          <ExternalLink className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-0">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Join Our Social Community</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Follow us on social media for daily tips, community highlights, 
                  and the latest updates from FlowPay.
                </p>
                <div className="flex justify-center gap-4 mb-6">
                  <Button variant="outline" size="sm" className="border-purple-200">
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-200">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-200">
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-200">
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Join Community Discord
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}