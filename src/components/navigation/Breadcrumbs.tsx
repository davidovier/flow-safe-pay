import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'New Project',
  '/deals': 'Deals',
  '/deliverables': 'Deliverables',
  '/payouts': 'Payouts',
  '/payments': 'Payments',
  '/creators': 'Creators',
  '/admin': 'Admin',
  '/admin/users': 'Users',
  '/admin/deals': 'Deals',
  '/admin/transactions': 'Transactions',
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard', icon: Home }
  ]
  
  let currentPath = ''
  
  for (const path of paths) {
    currentPath += `/${path}`
    
    // Skip if it's an ID (numeric or UUID-like)
    if (/^[0-9a-f-]{8,}$/.test(path) || /^\d+$/.test(path)) {
      continue
    }
    
    const label = routeLabels[currentPath] || path.charAt(0).toUpperCase() + path.slice(1)
    
    breadcrumbs.push({
      label,
      href: currentPath
    })
  }
  
  return breadcrumbs
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation()
  
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname)
  
  if (breadcrumbItems.length <= 1) {
    return null
  }
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          const Icon = item.icon
          
          return (
            <li key={item.href || item.label} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              
              {isLast ? (
                <span 
                  className="font-medium text-foreground flex items-center gap-1"
                  aria-current="page"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </span>
              ) : (
                <Link 
                  to={item.href!}
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
