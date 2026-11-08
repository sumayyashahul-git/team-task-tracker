// Runs the Lambda handler on your laptop.
// Usage: node --env-file=.env run-local.mjs [YYYY-MM-DD]
import { handler } from './index.mjs';

const date = process.argv[2];
const result = await handler(date ? { date } : {});
console.log('Result:', result);
process.exit(0);
