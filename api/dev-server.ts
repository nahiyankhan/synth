/**
 * Development Server for Hono API
 * Run with: tsx watch api/dev-server.ts
 */

import { serve } from '@hono/node-server';
import app from './index';

const port = 3001;

console.log(`🚀 API server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✓ API server running on http://localhost:${port}`);
console.log('  Endpoints:');
console.log('  - GET  /api/health');
console.log('  - POST /api/chat');
console.log('  - POST /api/generate');
console.log('  - POST /api/generate/ui');
