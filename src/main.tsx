import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applySecurityHeaders } from './utils/security/securityHeaders';

// Apply security headers for enhanced protection (disabled in development for preview compatibility)
if (import.meta.env.PROD) {
  applySecurityHeaders();
}

createRoot(document.getElementById("root")!).render(<App />);
