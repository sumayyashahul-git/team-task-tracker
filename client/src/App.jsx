import { useEffect, useState } from 'react';
import { api } from './api';
import TaskForm from './components/TaskForm';
import TaskBoard from './components/TaskBoard';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [assignee, setAssignee] = useState(''); // '' = everyone
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
      throw err; // lets the form know it failed, so it keeps the input
    }
  }

  async function handleMove(task, status) {
    setError('');
    try {
      const updated = await api.updateTask(task.id, { status });
      // Replace just the changed task; React re-renders the board.
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

  // Unique, sorted list of names for the filter dropdown.
  const assignees = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))].sort();
  const visible = assignee ? tasks.filter((t) => t.assignee === assignee) : tasks;

  return (
    <main className="app">
      <header className="app-header">
        <h1>Team Task Tracker</h1>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Everyone</option>
          {assignees.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </header>

      <TaskForm onCreate={handleCreate} />

      {error && <p className="error">{error}</p>}

      {loading ? <p>Loading…</p> : <TaskBoard tasks={visible} onMove={handleMove} onDelete={handleDelete} />}
    </main>
  );
}