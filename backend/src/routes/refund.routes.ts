import { Router } from 'express';
import { refundController } from '../controllers/refund.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { requestRefundSchema } from '../validators/refund.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(requestRefundSchema), refundController.requestRefund);
router.get('/', refundController.getRefunds);
router.get('/:id', refundController.getRefundById);

export default router;
