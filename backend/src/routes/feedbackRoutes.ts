import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { feedbackSchema } from '../validators/paymentValidators.js';
import { submitFeedback, listFeedback } from '../controllers/feedbackController.js';

const router = Router();

router.post('/', requireAuth, validate(feedbackSchema), submitFeedback);
router.get('/', requireAuth, listFeedback);

export default router;
