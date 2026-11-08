import pg from 'pg';

// Created OUTSIDE the handler on purpose. Lambda keeps the container
// "warm" between runs, so the next run reuses this connection pool
// instead of opening a new database connection every time.
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 1, // one run at a time needs only one connection
});

// "Yesterday" means yesterday in Dubai, not in UTC.
const TZ = process.env.REPORT_TIMEZONE || 'Asia/Dubai';

// event.date (optional, 'YYYY-MM-DD') lets you re-run the summary for a past day.
export async function handler(event = {}) {
  console.log(`Daily summary starting (timezone ${TZ}, requested date ${event.date ?? 'yesterday'})`);
  const client = await pool.connect();
  try {
    // One transaction: either both steps succeed, or neither is saved.
    await client.query('BEGIN');

    // 1. Flag open tasks whose due date has passed.
    const overdue = await client.query(
      `UPDATE tasks SET is_overdue = TRUE
       WHERE status <> 'done'
         AND due_date < (NOW() AT TIME ZONE $1)::date
         AND is_overdue = FALSE`,
      [TZ]
    );

    // 2. Which day are we summarising? Default: yesterday (Dubai time).
    const dayResult = await client.query(
      `SELECT COALESCE($2::date, (NOW() AT TIME ZONE $1)::date - 1)::text AS day`,
      [TZ, event.date ?? null]
    );
    const day = dayResult.rows[0].day;

    // 3. Calculate the numbers and save them. ON CONFLICT = "upsert":
    //    running twice for the same day updates the row instead of failing.
    const summary = await client.query(
      `INSERT INTO daily_summary
         (summary_date, total_open, completed_today, overdue_count, created_today)
       SELECT
         $2::date,
         COUNT(*) FILTER (WHERE status <> 'done'),
         COUNT(*) FILTER (WHERE (completed_at AT TIME ZONE $1)::date = $2::date),
         COUNT(*) FILTER (WHERE status <> 'done' AND due_date <= $2::date),
         COUNT(*) FILTER (WHERE (created_at AT TIME ZONE $1)::date = $2::date)
       FROM tasks
       ON CONFLICT (summary_date) DO UPDATE SET
         total_open      = EXCLUDED.total_open,
         completed_today = EXCLUDED.completed_today,
         overdue_count   = EXCLUDED.overdue_count,
         created_today   = EXCLUDED.created_today,
         generated_at    = NOW()
       RETURNING summary_date::text, total_open, completed_today, overdue_count, created_today`,
      [TZ, day]
    );

    await client.query('COMMIT');

    const result = { day, newlyOverdue: overdue.rowCount, summary: summary.rows[0] };
    console.log(JSON.stringify(result)); // appears in CloudWatch Logs
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Daily summary failed', err);
    throw err; // marks the run as failed, so it shows up in monitoring
  } finally {
    client.release();
  }
}
