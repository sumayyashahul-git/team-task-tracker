import { useEffect, useState } from 'react';
import { api } from '../api';

const STATS = [
  { key: 'total_open', label: 'Open tasks' },
  { key: 'created_today', label: 'Created today' },
  { key: 'completed_today', label: 'Completed today' },
  { key: 'overdue_count', label: 'Overdue', danger: true },
];

// '2026-11-07' -> 'Sat 7'
function formatDay(iso) {
  return new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // Fetches fresh numbers every time the Dashboard tab is opened,
  // because switching tabs mounts this component again.
  useEffect(() => {
    api.getSummary(7).then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="subtitle">Loading…</p>;

  const { live, history } = data;
  // The tallest bar fills the chart; the others are scaled to it.
  // Math.max(1, ...) avoids dividing by zero when every day is 0.
  const max = Math.max(1, ...history.map((d) => d.completed_today));

  return (
    <>
      <div className="stats">
        {STATS.map((s) => (
          <div key={s.key} className="stat">
            <span className="stat-label">{s.label}</span>
            <span className={`stat-value ${s.danger && live[s.key] > 0 ? 'stat-danger' : ''}`}>
              {live[s.key]}
            </span>
          </div>
        ))}
      </div>

      <section className="panel">
        <header className="panel-header">
          <h2>Completed per day</h2>
          <span className="subtitle">Last 7 days · written by the daily Lambda job</span>
        </header>

        {history.length === 0 ? (
          <div className="empty">
            No history yet. The daily Lambda job (Step 9) adds one row per day.
          </div>
        ) : (
          <div className="chart">
            {history.map((d) => (
              <div key={d.summary_date} className="chart-col">
                <span className="chart-value">{d.completed_today}</span>
                <div className="chart-track">
                  <div
                    className="chart-bar"
                    style={{ height: `${(d.completed_today / max) * 100}%` }}
                  />
                </div>
                <span className="chart-label">{formatDay(d.summary_date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}