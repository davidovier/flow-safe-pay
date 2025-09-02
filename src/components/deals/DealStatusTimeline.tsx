import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  DollarSign, 
  Upload, 
  FileText, 
  AlertCircle,
  Shield,
  Wallet
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'current' | 'upcoming';
  actor?: string;
  amount?: number;
  currency?: string;
}

interface Deal {
  id: string;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  created_at: string;
  funded_at?: string;
  completed_at?: string;
  amount_total: number;
  currency: string;
  milestones: Array<{
    id: string;
    title: string;
    amount: number;
    state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
    submitted_at?: string;
    approved_at?: string;
    released_at?: string;
  }>;
  projects: {
    title: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  };
  users: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface DealStatusTimelineProps {
  deal: Deal;
}

export function DealStatusTimeline({ deal }: DealStatusTimelineProps) {
  const getBrandName = () => {
    const brand = deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || 'Brand';
  };

  const getCreatorName = () => {
    if (!deal.users) return 'Creator';
    return `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim() || 'Creator';
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Deal created
    events.push({
      id: 'created',
      type: 'deal.created',
      title: 'Deal Created',
      description: `${getBrandName()} created a deal for ${deal.projects.title}`,
      timestamp: deal.created_at,
      status: 'completed',
      actor: getBrandName(),
    });

    // Deal funded
    if (deal.funded_at) {
      events.push({
        id: 'funded',
        type: 'deal.funded',
        title: 'Deal Funded',
        description: `${getBrandName()} funded the deal with escrow protection`,
        timestamp: deal.funded_at,
        status: 'completed',
        actor: getBrandName(),
        amount: deal.amount_total,
        currency: deal.currency,
      });
    } else if (deal.state === 'DRAFT') {
      events.push({
        id: 'funding_pending',
        type: 'deal.funding_pending',
        title: 'Awaiting Funding',
        description: 'Deal is waiting to be funded by the brand',
        timestamp: '',
        status: 'current',
      });
    }

    // Milestone events
    if (deal.state !== 'DRAFT') {
      deal.milestones.forEach((milestone, index) => {
        const milestonePrefix = `milestone_${milestone.id}`;

        // Milestone work started (when deal was funded)
        if (deal.funded_at && milestone.state !== 'PENDING') {
          events.push({
            id: `${milestonePrefix}_started`,
            type: 'milestone.started',
            title: `Started: ${milestone.title}`,
            description: `${getCreatorName()} began working on milestone ${index + 1}`,
            timestamp: deal.funded_at,
            status: 'completed',
            actor: getCreatorName(),
          });
        }

        // Milestone submitted
        if (milestone.submitted_at) {
          events.push({
            id: `${milestonePrefix}_submitted`,
            type: 'milestone.submitted',
            title: `Submitted: ${milestone.title}`,
            description: `${getCreatorName()} submitted deliverables for review`,
            timestamp: milestone.submitted_at,
            status: 'completed',
            actor: getCreatorName(),
          });
        } else if (milestone.state === 'PENDING' && deal.state === 'FUNDED') {
          events.push({
            id: `${milestonePrefix}_pending`,
            type: 'milestone.pending',
            title: `In Progress: ${milestone.title}`,
            description: 'Creator is working on this milestone',
            timestamp: '',
            status: 'current',
          });
        }

        // Milestone approved
        if (milestone.approved_at) {
          events.push({
            id: `${milestonePrefix}_approved`,
            type: 'milestone.approved',
            title: `Approved: ${milestone.title}`,
            description: `${getBrandName()} approved the milestone deliverables`,
            timestamp: milestone.approved_at,
            status: 'completed',
            actor: getBrandName(),
          });
        } else if (milestone.state === 'SUBMITTED') {
          events.push({
            id: `${milestonePrefix}_review_pending`,
            type: 'milestone.review_pending',
            title: `Under Review: ${milestone.title}`,
            description: 'Brand is reviewing the submitted deliverables',
            timestamp: '',
            status: 'current',
          });
        }

        // Milestone released/paid
        if (milestone.released_at) {
          events.push({
            id: `${milestonePrefix}_released`,
            type: 'milestone.released',
            title: `Payment Released: ${milestone.title}`,
            description: `${formatAmount(milestone.amount, deal.currency)} paid to ${getCreatorName()}`,
            timestamp: milestone.released_at,
            status: 'completed',
            actor: 'System',
            amount: milestone.amount,
            currency: deal.currency,
          });
        } else if (milestone.state === 'APPROVED') {
          events.push({
            id: `${milestonePrefix}_payment_pending`,
            type: 'milestone.payment_pending',
            title: `Payment Pending: ${milestone.title}`,
            description: 'Payment will be released shortly',
            timestamp: '',
            status: 'current',
            amount: milestone.amount,
            currency: deal.currency,
          });
        }

        // Future milestones
        if (milestone.state === 'PENDING' && deal.state === 'FUNDED' && index > 0) {
          const previousCompleted = deal.milestones
            .slice(0, index)
            .every(m => m.state === 'RELEASED');
          
          if (!previousCompleted) {
            events.push({
              id: `${milestonePrefix}_waiting`,
              type: 'milestone.waiting',
              title: `Waiting: ${milestone.title}`,
              description: 'Waiting for previous milestones to complete',
              timestamp: '',
              status: 'upcoming',
            });
          }
        }
      });
    }

    // Deal completion
    if (deal.completed_at) {
      events.push({
        id: 'completed',
        type: 'deal.completed',
        title: 'Deal Completed',
        description: 'All milestones completed and payments released',
        timestamp: deal.completed_at,
        status: 'completed',
      });
    } else if (deal.state === 'RELEASED') {
      events.push({
        id: 'completion_pending',
        type: 'deal.completion_pending',
        title: 'Deal Completion',
        description: 'Final milestones are being processed',
        timestamp: '',
        status: 'current',
      });
    }

    // Sort events by timestamp (completed events first, then current, then upcoming)
    return events.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (b.status === 'completed' && a.status !== 'completed') return 1;
      if (a.timestamp && b.timestamp) {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return 0;
    });
  };

  const getEventIcon = (type: string, status: string) => {
    const className = `h-4 w-4 ${
      status === 'completed' ? 'text-green-600' :
      status === 'current' ? 'text-blue-600' :
      'text-gray-400'
    }`;

    switch (type) {
      case 'deal.created':
      case 'deal.completed':
        return <FileText className={className} />;
      case 'deal.funded':
      case 'milestone.payment_pending':
      case 'milestone.released':
        return <DollarSign className={className} />;
      case 'milestone.started':
      case 'milestone.pending':
      case 'milestone.waiting':
        return <Clock className={className} />;
      case 'milestone.submitted':
        return <Upload className={className} />;
      case 'milestone.approved':
      case 'milestone.review_pending':
        return status === 'completed' ? <CheckCircle className={className} /> : <AlertCircle className={className} />;
      case 'deal.funding_pending':
        return <Wallet className={className} />;
      default:
        return status === 'completed' ? <CheckCircle className={className} /> : <Circle className={className} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>;
      case 'current':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="text-xs">Upcoming</Badge>;
      default:
        return null;
    }
  };

  const timelineEvents = generateTimelineEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Deal Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {index !== timelineEvents.length - 1 && (
                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200" />
              )}
              
              {/* Event */}
              <div className="flex items-start gap-4">
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                  ${event.status === 'completed' ? 'bg-green-100' :
                    event.status === 'current' ? 'bg-blue-100' :
                    'bg-gray-100'}
                `}>
                  {getEventIcon(event.type, event.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      {event.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.timestamp)}
                        </p>
                      )}
                      {event.actor && (
                        <p className="text-xs text-muted-foreground">
                          by {event.actor}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(event.status)}
                      {event.amount && (
                        <span className="text-xs font-medium text-green-600">
                          {formatAmount(event.amount, event.currency!)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}