import mongoose from 'mongoose';
import { createApp } from './app.js';
import { readConfig } from './config.js';

let loaded;

function getApp() {
  if (!loaded) {
    loaded = (async () => {
      const config = readConfig();
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

export async function embeddedApi(req, res) {
  let app;
  try {
    app = await getApp();
  } catch (error) {
    console.error('API initialization failed:', error.name, error.code || '');
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ status: 'unavailable', error: 'Database or API configuration unavailable' }));
    return;
  }
  app(req, res);
}
