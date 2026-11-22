import express from 'express';
import { embeddedApi } from './embedded.js';

const app = express();
app.disable('x-powered-by');
app.use(embeddedApi);

export default app;
