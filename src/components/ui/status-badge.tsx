import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' };
      case 'funded':
      case 'active':
        return { variant: 'default' as const, className: 'bg-primary text-primary-foreground' };
      case 'released':
      case 'completed':
      case 'approved':
        return { variant: 'default' as const, className: 'bg-success text-success-foreground' };
      case 'disputed':
      case 'failed':
      case 'rejected':
        return { variant: 'destructive' as const, className: '' };
      case 'pending':
      case 'submitted':
        return { variant: 'default' as const, className: 'bg-warning text-warning-foreground' };
      case 'refunded':
      case 'cancelled':
        return { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' };
      default:
        return { variant: 'secondary' as const, className: 'bg-muted text-muted-foreground' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
}