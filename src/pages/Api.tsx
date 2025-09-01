import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Api() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the comprehensive API documentation page
    navigate('/api-docs', { replace: true });
  }, [navigate]);

  return null;
}