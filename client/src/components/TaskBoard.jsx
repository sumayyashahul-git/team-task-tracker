const COLUMNS = [
  { status: 'todo', title: 'To Do' },
  { status: 'in_progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];
const ORDER = COLUMNS.map((c) => c.status);

// Today's date in the browser's own timezone, as 'YYYY-MM-DD'.
// ('en-CA' happens to format dates that way.)
const today = () => new Date().toLocaleDateString('en-CA');

function isOverdue(task) {
  if (task.status === 'done') return false;
  // is_overdue is set by the daily Lambda; the date check covers today.
  return task.is_overdue || (task.due_date && task.due_date < today());
}

function TaskCard({ task, onMove, onDelete }) {
  const index = ORDER.indexOf(task.status);
  const overdue = isOverdue(task);

  return (
    <article className={`card ${overdue ? 'card-overdue' : ''}`}>
      <h3>{task.title}</h3>
      <p className="meta">
        {task.assignee || 'Unassigned'}
        {task.due_date && ` · due ${task.due_date}`}
      </p>
      <div className="tags">
        <span className={`tag tag-${task.priority}`}>{task.priority}</span>
        {overdue && <span className="tag tag-overdue">Overdue</span>}
      </div>
      <div className="actions">
        {index > 0 && (
          <button onClick={() => onMove(task, ORDER[index - 1])} title="Move back">←</button>
        )}
        {index < ORDER.length - 1 && (
          <button onClick={() => onMove(task, ORDER[index + 1])} title="Move forward">→</button>
        )}
        <button className="danger" onClick={() => onDelete(task)}>Delete</button>
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
            <h2>
              {col.title} <span className="count">{items.length}</span>
            </h2>
            {items.length === 0 && <p className="empty">Nothing here</p>}
            {items.map((t) => (
              <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} />
            ))}
          </section>
        );
      })}
    </div>
  );
}