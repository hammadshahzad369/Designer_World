import mongoose from 'mongoose';
import { createApp } from './create-app.js';
import { ConfigError, readConfig } from './config.js';

let loaded;

function getApp() {
  if (!loaded) {
    loaded = (async () => {
      const config = readConfig(process.env, { embedded: true });
      await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      await Promise.all(Object.values(mongoose.models).map(model => model.init()));
      return createApp(config, { healthPrefix: '/api' });
    })().catch(error => {
      loaded = undefined;
      throw error;
    });
  }
  return loaded;
}

function failureCategory(error) {
  if (error instanceof ConfigError) return 'configuration_invalid';

  const failures = [
    error,
    ...Array.from(error.reason?.servers?.values() || [], server => server.error).filter(Boolean),
  ];
  const codes = failures.flatMap(failure => [failure.code, failure.cause?.code]);
  if (codes.includes(18) || codes.includes(8000)) return 'database_authentication_failed';
  if (codes.includes(13)) return 'database_permission_denied';
  if (codes.some(code => ['ENOTFOUND', 'ENODATA', 'EAI_AGAIN', 'ESERVFAIL', 'EREFUSED'].includes(code))) {
    return 'database_dns_failed';
  }
  if (error.name === 'MongoParseError' || error.name === 'MongoInvalidArgumentError') {
    return 'database_uri_invalid';
  }
  if (error.name === 'MongooseServerSelectionError') return 'database_unreachable';
  return 'api_initialization_failed';
}

export async function embeddedApi(req, res) {
  let app;
  try {
    app = await getApp();
  } catch (error) {
    const detail = error instanceof ConfigError
      ? error.message
      : [error.name, error.code, error.cause?.code].filter(Boolean).join(' ');
    const reason = failureCategory(error);
    console.error('API initialization failed:', reason, detail);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    const readinessRequest = req.path === '/api/ready';
    res.end(JSON.stringify({
      status: 'unavailable',
      error: 'Database or API configuration unavailable',
      ...(readinessRequest && { reason }),
    }));
    return;
  }
  app(req, res);
}
