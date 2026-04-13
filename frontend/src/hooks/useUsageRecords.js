import { useEffect, useState } from 'react';
import { fetchUsageRecords } from '../utils/api';
import { USAGE_DATA_UPDATED_EVENT } from '../utils/cloudEvents';

export function useUsageRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadUsage = async () => {
      if (mounted) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await fetchUsageRecords();

        if (mounted) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (mounted) {
          setRecords([]);
          setError(loadError.message || 'Failed to fetch usage data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const handleUsageUpdated = (event) => {
      if (Array.isArray(event.detail?.records)) {
        setRecords(event.detail.records);
        setLoading(false);
        setError('');
        return;
      }

      loadUsage();
    };

    loadUsage();
    window.addEventListener(USAGE_DATA_UPDATED_EVENT, handleUsageUpdated);

    return () => {
      mounted = false;
      window.removeEventListener(USAGE_DATA_UPDATED_EVENT, handleUsageUpdated);
    };
  }, []);

  return { records, loading, error, setRecords };
}
