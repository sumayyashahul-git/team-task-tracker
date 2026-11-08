import { useEffect, useState } from 'react';
import { api } from './api';
import TaskForm from './components/TaskForm';
import TaskBoard, { isOverdue } from './components/TaskBoard';
import BoardToolbar from './components/BoardToolbar';
import Dashboard from './components/Dashboard';
import StatusIndicator from './components/StatusIndicator';

export default function App() {
  const [view, setView] = useState('board');
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // ---- Filter state ----
  const [assignee, setAssignee] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    api
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(form) {
    setError('');
    try {
      const created = await api.createTask(form);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleMove(task, status) {
    setError('');
    try {
      const updated = await api.updateTask(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setError('');
    try {
      await api.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.message);
    }
  }

  function clearFilters() {
    setAssignee('');
    setSearch('');
    setStatusFilter('all');
    setOverdueOnly(false);
  }

  // ---- Filtering (derived from state on every render, nothing extra stored) ----
  const term = search.trim().toLowerCase();

  // Everything except the status filter: used for the counts on the status toggle.
  const filtered = tasks.filter(
    (t) =>
      (!assignee || t.assignee === assignee) &&
      (!overdueOnly || isOverdue(t)) &&
      (!term ||
        t.title.toLowerCase().includes(term) ||
        (t.assignee || '').toLowerCase().includes(term))
  );

  const counts = {
    all: filtered.length,
    todo: filtered.filter((t) => t.status === 'todo').length,
    in_progress: filtered.filter((t) => t.status === 'in_progress').length,
    done: filtered.filter((t) => t.status === 'done').length,
  };

  const visible = statusFilter === 'all' ? filtered : filtered.filter((t) => t.status === statusFilter);
  const filtersActive = Boolean(assignee || term || overdueOnly || statusFilter !== 'all');
  const overdueCount = visible.filter(isOverdue).length;
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">T</span>
            <span className="brand-name">Team Task Tracker</span>
          </div>
          <nav className="nav">
            <button className={`nav-link ${view === 'board' ? 'active' : ''}`} onClick={() => setView('board')}>
              Board
            </button>
            <button className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              Dashboard
            </button>
          </nav>
          <div className="topbar-right">
            <StatusIndicator />
          </div>
        </div>
      </header>

      <main className="page">
        {view === 'dashboard' ? (
          <>
            <div className="page-header">
              <div>
                <h1>Dashboard</h1>
                <p className="subtitle">How the team is doing today</p>
              </div>
            </div>
            <Dashboard />
          </>
        ) : (
          <>
            <div className="page-header">
              <div>
                <h1>Board</h1>
                <p className="subtitle">
                  {filtersActive ? `${visible.length} of ${tasks.length}` : visible.length}{' '}
                  {tasks.length === 1 ? 'task' : 'tasks'} · {overdueCount} overdue
                </p>
              </div>
              <label className="filter">
                Assignee
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Everyone</option>
                  {assignees.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>

            <TaskForm onCreate={handleCreate} />

            <BoardToolbar
              search={search}
              onSearch={setSearch}
              status={statusFilter}
              onStatus={setStatusFilter}
              counts={counts}
              overdueOnly={overdueOnly}
              onOverdueOnly={setOverdueOnly}
            />

            {error && <p className="error">{error}</p>}

            {loading ? (
              <p className="subtitle">Loading…</p>
            ) : filtersActive && visible.length === 0 ? (
              <div className="no-results">
                <p>No tasks match your filters.</p>
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            ) : (
              <TaskBoard tasks={visible} statusFilter={statusFilter} onMove={handleMove} onDelete={handleDelete} />
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>Team Task Tracker · v1.2</span>
        <span>React on Vercel · Node.js on AWS ECS Fargate · PostgreSQL on Amazon RDS</span>
      </footer>
    </>
  );
}
