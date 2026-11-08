import { useEffect, useState } from 'react';
import { api } from './api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Runs once when the component first appears (like ngOnInit).
  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Team Task Tracker</h1>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <strong>{t.title}</strong> — {t.assignee || 'Unassigned'} · {t.priority} · {t.status}
          </li>
        ))}
      </ul>
    </main>
  );
}