import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { apiRoutes } from './routes/index.js';

export function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY_HOPS || false);
  app.use(helmet());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/ready', async (_req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) throw new Error('MongoDB unavailable');
      await mongoose.connection.db.command({ ping: 1 }, { maxTimeMS: 1500 });
    } catch {
      return res.status(503).json({ status: 'unavailable' });
    }
    res.json({ status: 'ready' });
  });

  app.use('/api', rateLimit({
    windowMs: 60 * 1000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many requests' },
  }), express.json({ limit: '32kb' }), apiRoutes(config.JWT_ACCESS_SECRET));

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
    console.error('Request failed', error.name);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}
