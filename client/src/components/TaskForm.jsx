import { useState } from 'react';

const EMPTY = { title: '', assignee: '', priority: 'medium', due_date: '' };

export default function TaskForm({ onCreate }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  // Returns a change handler for one field, e.g. update('title')
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser reloading the page
    setSaving(true);
    try {
      await onCreate(form);
      setForm(EMPTY); // clear only if it saved
    } catch {
      // App shows the error message; keep what the user typed
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        placeholder="What needs doing?"
        value={form.title}
        onChange={update('title')}
        maxLength={200}
        required
      />
      <input placeholder="Assignee" value={form.assignee} onChange={update('assignee')} />
      <select value={form.priority} onChange={update('priority')}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <input type="date" value={form.due_date} onChange={update('due_date')} />
            <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Adding…' : 'Add task'}
      </button>
    </form>
  );
}