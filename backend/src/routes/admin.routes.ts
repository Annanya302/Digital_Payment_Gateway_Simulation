import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/transactions', adminController.getTransactions);

export default router;
