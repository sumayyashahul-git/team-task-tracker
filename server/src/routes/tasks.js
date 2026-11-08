const express = require('express');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

// Returns a list of error messages. Empty list = valid.
// partial = true for PATCH, where every field is optional.
function validate(body, partial = false) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.push('title is required');
    } else if (body.title.length > 200) {
      errors.push('title must be 200 characters or fewer');
    }
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  if (body.due_date && Number.isNaN(Date.parse(body.due_date))) {
    errors.push('due_date must be a date like 2026-11-15');
  }
  return errors;
}

module.exports = function tasksRouter(db) {
  const router = express.Router();

  // GET /api/tasks?status=todo&assignee=Sumayya
  router.get('/', async (req, res, next) => {
    try {
      const where = [];
      const params = [];
      if (req.query.status) {
        params.push(req.query.status);
        where.push(`status = $${params.length}`);
      }
      if (req.query.assignee) {
        params.push(req.query.assignee);
        where.push(`assignee = $${params.length}`);
      }
      let sql = 'SELECT * FROM tasks';
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY due_date NULLS LAST, created_at DESC';

      const { rows } = await db.query(sql, params);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/tasks
  router.post('/', async (req, res, next) => {
    try {
      const errors = validate(req.body);
      if (errors.length) return res.status(400).json({ errors });

      const { title, assignee, priority = 'medium', due_date } = req.body;
      const { rows } = await db.query(
        `INSERT INTO tasks (title, assignee, priority, due_date)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title.trim(), assignee || null, priority, due_date || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/tasks/5   body: { "status": "done" }
  router.patch('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ errors: ['invalid id'] });

      const errors = validate(req.body, true);
      if (errors.length) return res.status(400).json({ errors });

      // Build "SET field = $n" only for the fields that were sent.
      // Field names come from this fixed list, never from the user,
      // so this is safe from SQL injection.
      const sets = [];
      const params = [];
      for (const field of ['title', 'assignee', 'priority', 'status', 'due_date']) {
        if (req.body[field] !== undefined) {
          params.push(req.body[field] === '' ? null : req.body[field]);
          sets.push(`${field} = $${params.length}`);
        }
      }
      if (!sets.length) return res.status(400).json({ errors: ['nothing to update'] });

      // Keep completed_at in step with the status.
      if (req.body.status === 'done') sets.push('completed_at = COALESCE(completed_at, NOW())');
      else if (req.body.status) sets.push('completed_at = NULL');

      // Finishing a task or changing its due date clears the overdue flag.
      if (req.body.status === 'done' || req.body.due_date !== undefined) {
        sets.push('is_overdue = FALSE');
      }

      params.push(id);
      const { rows } = await db.query(
        `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (!rows.length) return res.status(404).json({ error: 'Task not found' });
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/tasks/5
  router.delete('/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ errors: ['invalid id'] });

      const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [id]);
      if (!rowCount) return res.status(404).json({ error: 'Task not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
};