import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordPaymentSchema } from '../validators/paymentValidators.js';
import {
  recordPayment,
  getPaymentByTxHash,
  listPaymentsForPool,
  listMyPayments,
  confirmPayment,
} from '../controllers/paymentController.js';

const router = Router();

router.post('/', requireAuth, validate(recordPaymentSchema), recordPayment);
router.get('/mine', requireAuth, listMyPayments);
router.get('/pool/:poolId', listPaymentsForPool);
router.get('/tx/:hash', getPaymentByTxHash);
router.patch('/:paymentId/confirm', requireAuth, requireRole('admin'), confirmPayment);

export default router;
