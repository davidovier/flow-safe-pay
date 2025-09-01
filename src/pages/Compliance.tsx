import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Compliance() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the comprehensive Security & Compliance page
    navigate('/security', { replace: true });
  }, [navigate]);

  return null;
}