import { Router } from 'express';
import { bankController } from '../controllers/bank.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = Router();

// Public: list available simulated banks
router.get('/', bankController.getBanks);

// Authenticated customer endpoints
router.get('/accounts', authenticate, bankController.getUserAccounts);
router.post('/accounts', authenticate, bankController.linkAccount);
router.patch('/accounts/:id/primary', authenticate, bankController.setPrimary);
router.post('/accounts/:id/topup', authenticate, bankController.topUpAccount);
router.post('/accounts/:id/check-balance', authenticate, bankController.checkBalance.bind(bankController));

// Admin-only: Toggle bank switch health status
router.patch('/:code/health', authenticate, requireAdmin, bankController.updateHealth);

export default router;
