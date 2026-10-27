import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Endpoints
app.use(config.apiPrefix, apiRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CloudBite API (Node.js)',
    environment: config.nodeEnv,
    time: new Date().toISOString(),
  });
});
