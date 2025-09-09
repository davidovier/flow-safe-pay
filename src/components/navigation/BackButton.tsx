import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  to?: string
  label?: string
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  onClick?: () => void
}

export default function BackButton({ 
  to, 
  label = "Back", 
  className, 
  variant = "ghost",
  onClick 
}: BackButtonProps) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (to) {
      navigate(to)
    } else {
      navigate(-1)
    }
  }
  
  return (
    <Button 
      variant={variant}
      size="sm"
      onClick={handleClick}
      className={cn("gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
