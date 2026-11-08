const express = require('express');

module.exports = function summaryRouter(db) {
  const router = express.Router();

  // GET /api/summary?days=7
  router.get('/', async (req, res, next) => {
    try {
      // Clamp to 1–90 days so nobody can request a huge range.
      const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);

      // FILTER (WHERE ...) is Postgres's tidy alternative to
      // SUM(CASE WHEN ... THEN 1 ELSE 0 END) in SQL Server.
      const live = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status <> 'done')::int AS total_open,
          COUNT(*) FILTER (WHERE status = 'done'
                           AND completed_at >= date_trunc('day', NOW()))::int AS completed_today,
          COUNT(*) FILTER (WHERE status <> 'done'
                           AND due_date < CURRENT_DATE)::int AS overdue_count,
          COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS created_today
        FROM tasks
      `);

      const history = await db.query(
        `SELECT summary_date, total_open, completed_today, overdue_count, created_today
         FROM daily_summary
         WHERE summary_date >= CURRENT_DATE - $1::int
         ORDER BY summary_date`,
        [days]
      );

      res.json({ live: live.rows[0], history: history.rows });
    } catch (err) {
      next(err);
    }
  });

  return router;
};