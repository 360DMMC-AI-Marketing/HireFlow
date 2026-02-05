// Custom fetch hook
import { useState, useEffect } from 'react';

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Add fetch logic here
    setLoading(false);
  }, [url]);

  return { data, loading, error };
}
