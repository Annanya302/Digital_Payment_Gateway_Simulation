import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);

export default router;
