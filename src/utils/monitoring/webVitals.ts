import { onCLS, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  timestamp: number
  url: string
  userAgent: string
}

// Thresholds based on Core Web Vitals recommendations
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function sendToAnalytics(metric: PerformanceMetric) {
  // Send to multiple analytics providers
  
  // Console logging in development
  if (import.meta.env.DEV) {
    console.log('Web Vital:', metric)
  }
  
  // Send to Vercel Analytics
  if (window.va) {
    window.va('track', 'Web Vital', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      page_url: metric.url,
    })
  }
  
  // Send to Google Analytics (if configured)
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.rating,
      value: Math.round(metric.value),
      custom_map: {
        metric_rating: 'custom_parameter_1',
        page_url: 'custom_parameter_2',
      },
    })
  }
  
  // Send to custom API endpoint
  try {
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(() => {
      // Fail silently - don't let analytics errors affect user experience
    })
  } catch (error) {
    // Fail silently
  }
}

function createMetric(metric: Metric): PerformanceMetric {
  return {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }
}

export function initWebVitals() {
  // Only run in browsers
  if (typeof window === 'undefined') return
  
  // Track Core Web Vitals
  onCLS((metric) => sendToAnalytics(createMetric(metric)))
  onFCP((metric) => sendToAnalytics(createMetric(metric)))
  onLCP((metric) => sendToAnalytics(createMetric(metric)))
  onTTFB((metric) => sendToAnalytics(createMetric(metric)))
}

// Custom performance tracking
export function trackCustomMetric(name: string, value: number, attributes?: Record<string, any>) {
  const metric: PerformanceMetric = {
    name,
    value,
    rating: 'good', // Custom metrics don't have standard ratings
    delta: 0,
    id: `${name}-${Date.now()}`,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }
  
  sendToAnalytics(metric)
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('Custom Metric:', name, value, attributes)
  }
}

// Track user interactions
export function trackUserAction(action: string, category: string = 'User Interaction', attributes?: Record<string, any>) {
  if (window.va) {
    window.va('track', action, {
      category,
      ...attributes,
    })
  }
  
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      ...attributes,
    })
  }
  
  if (import.meta.env.DEV) {
    console.log('User Action:', action, category, attributes)
  }
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (window.va) {
    window.va('track', 'Page View', {
      path,
      title,
    })
  }
  
  if (window.gtag) {
    window.gtag('config', 'GA_TRACKING_ID', {
      page_path: path,
      page_title: title,
    })
  }
  
  if (import.meta.env.DEV) {
    console.log('Page View:', path, title)
  }
}

// Performance observer for additional metrics
export function initPerformanceObserver() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
  
  try {
    // Observe long tasks (> 50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        trackCustomMetric('Long Task', entry.duration, {
          entryType: entry.entryType,
          startTime: entry.startTime,
        })
      }
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
    
    // Observe layout shifts beyond CLS
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          trackCustomMetric('Layout Shift', (entry as any).value, {
            sources: (entry as any).sources?.length || 0,
          })
        }
      }
    })
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
    
  } catch (error) {
    // Fail silently if Performance Observer is not supported
  }
}

// Declare global interfaces for analytics
declare global {
  interface Window {
    va?: (event: string, data?: any) => void
    gtag?: (...args: any[]) => void
  }
}