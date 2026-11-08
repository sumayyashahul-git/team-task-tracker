import { useEffect, useState } from 'react';
import { api } from './api';
import TaskForm from './components/TaskForm';
import TaskBoard, { isOverdue } from './components/TaskBoard';
import Dashboard from './components/Dashboard';

export default function App() {
  const [view, setView] = useState('board'); // 'board' or 'dashboard'
  const [tasks, setTasks] = useState([]);
  const [assignee, setAssignee] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();
  const visible = assignee ? tasks.filter((t) => t.assignee === assignee) : tasks;
  const overdueCount = visible.filter(isOverdue).length;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">T</span>
            Team Task Tracker
          </div>
          <nav className="nav">
            <button
              className={`nav-link ${view === 'board' ? 'active' : ''}`}
              onClick={() => setView('board')}
            >
              Board
            </button>
            <button
              className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
          </nav>
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
                  {visible.length} {visible.length === 1 ? 'task' : 'tasks'} · {overdueCount} overdue
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

            {error && <p className="error">{error}</p>}

            {loading ? (
              <p className="subtitle">Loading…</p>
            ) : (
              <TaskBoard tasks={visible} onMove={handleMove} onDelete={handleDelete} />
            )}
          </>
        )}
      </main>
    </>
  );
}