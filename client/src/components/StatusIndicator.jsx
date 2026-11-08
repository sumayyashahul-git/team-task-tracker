import { useEffect, useState } from 'react';
import { api } from '../api';

const LABELS = {
  checking: 'Checking status',
  ok: 'All systems operational',
  down: 'Service degraded',
};

// Calls the API's database health check on load and every 60 seconds,
// so anyone using the app can see the whole stack is up.
export default function StatusIndicator() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await api.getHealth();
        if (!cancelled) setStatus('ok');
      } catch {
        if (!cancelled) setStatus('down');
      }
    }

    check();
    const timer = setInterval(check, 60000);

    // Cleanup when the component is removed (like ngOnDestroy):
    // stop the timer and ignore any request still in flight.
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <span className={`status status-${status}`} title="API and database health">
      <span className="status-dot" />
      <span className="status-label">{LABELS[status]}</span>
    </span>
  );
}
