import mongoose from 'mongoose';
import { createApp } from './app.js';
import { readConfig } from './config.js';

try {
  const config = readConfig();
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const server = createApp(config).listen(config.PORT, () => {
    console.log('StoreCraft API listening on port ' + config.PORT);
  });
  server.once('error', async error => {
    console.error('Unable to listen:', error.code || error.name);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => server.close(async () => {
      await mongoose.disconnect();
    }));
  }
} catch (error) {
  const message = error.message.startsWith('Missing or invalid environment variables:')
    ? error.message : 'API startup failed: ' + error.name;
  console.error(message);
  await mongoose.disconnect();
  process.exitCode = 1;
}
