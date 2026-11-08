-- 001_init.sql : Team Task Tracker schema

CREATE TABLE IF NOT EXISTS tasks (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  assignee     VARCHAR(100),
  priority     VARCHAR(10)  NOT NULL DEFAULT 'medium'
               CHECK (priority IN ('low', 'medium', 'high')),
  status       VARCHAR(20)  NOT NULL DEFAULT 'todo'
               CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date     DATE,
  is_overdue   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for the filters the API and Lambda use
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);

-- One row per day, written by the Lambda
CREATE TABLE IF NOT EXISTS daily_summary (
  summary_date    DATE        PRIMARY KEY,
  total_open      INT         NOT NULL,
  completed_today INT         NOT NULL,
  overdue_count   INT         NOT NULL,
  created_today   INT         NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);