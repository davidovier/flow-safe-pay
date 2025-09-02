import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { applySecurityHeaders } from './utils/security/securityHeaders';

// Apply security headers for enhanced protection
applySecurityHeaders();

createRoot(document.getElementById("root")!).render(<App />);
