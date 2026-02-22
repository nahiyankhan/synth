/**
 * Synth API Server
 * Hono-based API for design system generation with BYOK model
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handle } from 'hono/vercel';

import { errorHandler } from './middleware/error-handler';
import { chatRoutes } from './routes/chat';
import { generateRoutes } from './routes/generate';

// Create Hono app
const app = new Hono().basePath('/api');

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'X-Gemini-Key',
      'X-OpenAI-Key',
      'X-Anthropic-Key',
    ],
  })
);

// Error handler
app.onError(errorHandler);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
app.route('/chat', chatRoutes);
app.route('/generate', generateRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not found',
      code: 'NOT_FOUND',
    },
    404
  );
});

// Export for different environments
export default app;

// Vercel serverless exports
export const GET = handle(app);
export const POST = handle(app);
export const OPTIONS = handle(app);
