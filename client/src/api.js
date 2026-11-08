async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const message = data.errors ? data.errors.join(', ') : data.error;
    throw new Error(message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getTasks: () => request('/tasks'),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getSummary: (days = 7) => request(`/summary?days=${days}`),
};