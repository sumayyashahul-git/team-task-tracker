const express = require('express');
const cors = require('cors');

// The app is built in a function that takes the database.
// That lets tests pass in a fake database later.
function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json()); // parse JSON request bodies

const summaryRouter = require('./routes/summary');
  const tasksRouter = require('./routes/tasks');
  // The AWS load balancer calls this every few seconds.
  // It deliberately doesn't touch the database, so a slow DB
  // doesn't make AWS think the container is dead and restart it.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // A separate check that the database is reachable. Useful for debugging.
  app.get('/api/health/db', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ database: 'ok' });
    } catch (err) {
      res.status(503).json({ database: 'unreachable', error: err.message });
    }
  });
  app.use('/api/tasks', tasksRouter(db));
  app.use('/api/summary', summaryRouter(db));
  // Any URL that didn't match a route
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // Central error handler: Express knows it's an error handler
  // because it takes 4 arguments.
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };