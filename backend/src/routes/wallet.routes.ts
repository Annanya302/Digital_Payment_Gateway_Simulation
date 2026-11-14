import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', walletController.getWallet);
router.post('/topup', walletController.topUpWallet);
router.get('/transactions', walletController.getWalletTransactions);

export default router;
