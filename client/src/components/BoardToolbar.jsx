const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

// Presentational only: the parent (App) owns the filter state and
// passes values down, and this component reports changes back up.
export default function BoardToolbar({
  search, onSearch,
  status, onStatus, counts,
  overdueOnly, onOverdueOnly,
}) {
  return (
    <div className="toolbar">
      <div className="search">
        <svg className="search-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8.5 3a5.5 5.5 0 0 1 4.38 8.83l3.65 3.64a.75.75 0 1 1-1.06 1.06l-3.64-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
          />
        </svg>
        <input
          type="search"
          placeholder="Search tasks or assignees"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          aria-label="Search tasks"
        />
      </div>

      {/* Segmented control: one option active at a time.
          aria-pressed tells screen readers which one is selected. */}
      <div className="segmented" role="group" aria-label="Filter by status">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`segment ${status === opt.value ? 'active' : ''}`}
            aria-pressed={status === opt.value}
            onClick={() => onStatus(opt.value)}
          >
            {opt.label}
            <span className="segment-count">{counts[opt.value]}</span>
          </button>
        ))}
      </div>

      {/* Toggle switch: role="switch" + aria-checked is the accessible pattern. */}
      <label className="switch">
        <button
          type="button"
          role="switch"
          aria-checked={overdueOnly}
          className={`switch-track ${overdueOnly ? 'on' : ''}`}
          onClick={() => onOverdueOnly(!overdueOnly)}
        >
          <span className="switch-thumb" />
        </button>
        Overdue only
      </label>
    </div>
  );
}
