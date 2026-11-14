import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { sendMoneySchema, payMerchantSchema } from '../validators/payment.validator.js';

const router = Router();

router.use(authenticate);

router.post('/send', validateBody(sendMoneySchema), paymentController.sendMoney);
router.post('/merchant', validateBody(payMerchantSchema), paymentController.payMerchant);
router.get('/merchants', paymentController.getMerchants);
router.get('/:id', paymentController.getPaymentDetails);

export default router;
