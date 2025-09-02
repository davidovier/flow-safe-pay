import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applySecurityHeaders } from './utils/security/securityHeaders';

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

createRoot(document.getElementById("root")!).render(<App />);
