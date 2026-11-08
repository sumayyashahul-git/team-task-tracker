const COLUMNS = [
  { status: 'todo', title: 'To do' },
  { status: 'in_progress', title: 'In progress' },
  { status: 'done', title: 'Done' },
];

// The buttons each card shows, depending on which column it's in.
const ACTIONS = {
  todo: [{ label: 'Start', to: 'in_progress', primary: true }],
  in_progress: [
    { label: 'Back', to: 'todo' },
    { label: 'Complete', to: 'done', primary: true },
  ],
  done: [{ label: 'Reopen', to: 'in_progress' }],
};

// Today's date in the browser's timezone, as 'YYYY-MM-DD'.
const today = () => new Date().toLocaleDateString('en-CA');

export function isOverdue(task) {
  if (task.status === 'done') return false;
  return Boolean(task.is_overdue || (task.due_date && task.due_date < today()));
}

// '2026-11-10' -> '10 Nov'. Adding T00:00 makes the browser read it as
// local midnight instead of UTC, so the day never shifts.
function formatDate(iso) {
  return new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// 'Sumayya Shahul' -> 'SS'
function initials(name) {
  return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function TaskCard({ task, onMove, onDelete }) {
  const overdue = isOverdue(task);

  return (
    <article className={`card ${task.status === 'done' ? 'card-done' : ''}`}>
      <div className="card-top">
        <h3 className="card-title">{task.title}</h3>
        <span className={`priority priority-${task.priority}`}>{task.priority}</span>
      </div>

      <div className="card-meta">
        <span className="assignee">
          <span className="avatar">{task.assignee ? initials(task.assignee) : '?'}</span>
          {task.assignee || 'Unassigned'}
        </span>
        {task.due_date && (
          <span className={`due ${overdue ? 'due-overdue' : ''}`}>
            {overdue && 'Overdue · '}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      <div className="card-actions">
        {ACTIONS[task.status].map((action) => (
          <button
            key={action.to}
            className={`btn btn-sm ${action.primary ? 'btn-soft' : 'btn-ghost'}`}
            onClick={() => onMove(task, action.to)}
          >
            {action.label}
          </button>
        ))}
        <button
          className="btn btn-sm btn-ghost btn-delete"
          onClick={() => onDelete(task)}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function TaskBoard({ tasks, onMove, onDelete }) {
  return (
    <div className="board">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.status);
        return (
          <section key={col.status} className="column">
            <header className="column-header">
              <span className={`dot dot-${col.status}`} />
              <h2>{col.title}</h2>
              <span className="count">{items.length}</span>
            </header>
            <div className="column-body">
              {items.length === 0 ? (
                <div className="empty">No tasks</div>
              ) : (
                items.map((t) => (
                  <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}