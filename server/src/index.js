const { createApp } = require('./app');
const { createPool } = require('./db');

const port = Number(process.env.PORT) || 8080;
const pool = createPool();
const app = createApp(pool);

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

// During a deploy, ECS sends SIGTERM before stopping the old container.
// Closing cleanly lets in-flight requests finish and releases DB connections.
process.on('SIGTERM', () => {
  server.close(() => pool.end().then(() => process.exit(0)));
});