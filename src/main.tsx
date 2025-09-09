import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import { applySecurityHeaders } from './utils/security/securityHeaders'
import { initWebVitals, initPerformanceObserver } from './utils/monitoring/webVitals'

// Apply security headers for enhanced protection (disabled in development for preview compatibility)
try {
  if (import.meta.env?.PROD) {
    applySecurityHeaders();
  }
} catch (e) {
  if (process.env.NODE_ENV === 'production') {
    applySecurityHeaders();
  }
}

// Initialize performance monitoring
initWebVitals();
initPerformanceObserver();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);
