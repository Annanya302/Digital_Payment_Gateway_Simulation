import { Router } from 'express';
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import paymentRoutes from './payment.routes.js';
import transactionRoutes from './transaction.routes.js';
import refundRoutes from './refund.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/refunds', refundRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);

// Simulator info & health endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Digital Payment Gateway Simulation Backend',
    mode: 'SIMULATION_ONLY',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
