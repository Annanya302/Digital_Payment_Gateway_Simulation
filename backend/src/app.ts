import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulation Disclaimer Header
app.use((req, res, next) => {
  res.setHeader('X-Payment-Simulation', 'ACADEMIC_SIMULATION_NO_REAL_MONEY');
  next();
});

// Root welcome & simulation disclaimer
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    project: 'Digital Payment Gateway Simulation',
    boundary: 'SIMULATION ONLY - NO REAL MONEY IS PROCESSED',
    docs: '/api/health',
    version: '1.0.0',
    authors: ['Ankur', 'Atul', 'Anamay', 'Annanya'],
  });
});

// REST API routes
app.use('/api', apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route not found: [${req.method}] ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);
