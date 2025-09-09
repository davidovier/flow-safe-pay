import { useState, useEffect, useRef } from 'react'
import { Search, Users, FileText, DollarSign, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'creator' | 'project' | 'deal' | 'payout'
  url: string
  badge?: string
}

interface GlobalSearchProps {
  className?: string
}

const MOCK_RESULTS: SearchResult[] = [
  {
    id: '1',
    title: 'Sarah Chen',
    subtitle: 'Fashion Creator • 125K followers',
    type: 'creator',
    url: '/creators/1',
    badge: 'Verified'
  },
  {
    id: '2', 
    title: 'Summer Campaign 2024',
    subtitle: 'StyleCorp Brand Project',
    type: 'project',
    url: '/projects/2',
    badge: 'Active'
  },
  {
    id: '3',
    title: 'Instagram Post Deal',
    subtitle: 'Deal #1234 • $2,500',
    type: 'deal',
    url: '/deals/3',
    badge: 'Funded'
  }
]

const getIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'creator': return Users
    case 'project': return FileText
    case 'deal': return DollarSign
    case 'payout': return DollarSign
    default: return FileText
  }
}

const getTypeColor = (type: SearchResult['type']) => {
  switch (type) {
    case 'creator': return 'bg-blue-100 text-blue-700'
    case 'project': return 'bg-green-100 text-green-700' 
    case 'deal': return 'bg-purple-100 text-purple-700'
    case 'payout': return 'bg-orange-100 text-orange-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export default function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Simulate search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    
    setIsLoading(true)
    const timeoutId = setTimeout(() => {
      const filtered = MOCK_RESULTS.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.subtitle.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setIsLoading(false)
      setSelectedIndex(-1)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [query])
  
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex])
        }
        break
    }
  }
  
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url)
    setIsOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }
  
  const handleInputFocus = () => {
    setIsOpen(true)
  }
  
  // Global keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    
    document.addEventListener('keydown', handleGlobalKeydown)
    return () => document.removeEventListener('keydown', handleGlobalKeydown)
  }, [])
  
  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search creators, projects, deals... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 p-0 shadow-lg border">
          {results.length === 0 && !isLoading && query.length >= 2 && (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
          
          {results.map((result, index) => {
            const Icon = getIcon(result.type)
            const isSelected = index === selectedIndex
            
            return (
              <div
                key={result.id}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 transition-colors",
                  isSelected ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => handleResultClick(result)}
              >
                <div className={cn("p-2 rounded-lg", getTypeColor(result.type))}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{result.title}</span>
                    {result.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {result.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {result.subtitle}
                  </p>
                </div>
                
                <Badge variant="outline" className="text-xs capitalize">
                  {result.type}
                </Badge>
              </div>
            )
          })}
          
          {results.length > 0 && (
            <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground text-center">
              Use ↑↓ to navigate, Enter to select, Esc to close
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
