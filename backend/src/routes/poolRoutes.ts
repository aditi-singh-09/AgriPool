import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPoolSchema, poolIdParamSchema } from '../validators/poolValidators.js';
import { createPool, getPool, listPools, getPoolOnChainState } from '../controllers/poolController.js';

const router = Router();

router.get('/', listPools);
router.get('/:poolId', validate(poolIdParamSchema), getPool);
router.get('/:poolId/on-chain', validate(poolIdParamSchema), getPoolOnChainState);
router.post('/', requireAuth, requireRole('cooperative', 'admin'), validate(createPoolSchema), createPool);

export default router;
