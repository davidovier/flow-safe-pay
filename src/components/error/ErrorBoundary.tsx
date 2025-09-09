import React from 'react'
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  errorBoundary?: string
  errorBoundaryStack?: string
}

function logErrorToService(error: Error, errorInfo: ErrorInfo) {
  // Log to multiple error tracking services
  
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    ...errorInfo,
  }
  
  // Console logging in development
  if (import.meta.env.DEV) {
    console.error('Error Boundary caught an error:', error, errorInfo)
  }
  
  // Send to Sentry (if configured)
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: {
        errorBoundary: {
          componentStack: errorInfo.componentStack,
          errorBoundary: errorInfo.errorBoundary,
          errorBoundaryStack: errorInfo.errorBoundaryStack,
        },
      },
    })
  }
  
  // Send to Vercel Analytics
  if (window.va) {
    window.va('track', 'Error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 1000), // Limit stack size
      page_url: window.location.href,
    })
  }
  
  // Send to custom error endpoint
  try {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(() => {
      // Fail silently - don't let error reporting errors affect user experience
    })
  } catch (reportingError) {
    // Fail silently
  }
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            We're sorry, but something unexpected happened. The error has been logged and our team will investigate.
          </p>
          
          {import.meta.env.DEV && (
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Error Details (Development)</p>
              <p className="text-xs text-muted-foreground break-all">{error.message}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={resetErrorBoundary} 
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<FallbackProps>
}

export default function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={(error, errorInfo) => {
        logErrorToService(error, {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<FallbackProps>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for reporting errors manually
export function useErrorHandler() {
  return (error: Error, errorInfo?: Partial<ErrorInfo>) => {
    logErrorToService(error, {
      message: error.message,
      stack: error.stack,
      ...errorInfo,
    })
  }
}

// Declare global interfaces
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void
    }
  }
}