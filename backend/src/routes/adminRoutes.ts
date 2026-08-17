import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPlatformStats } from '../controllers/adminController.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('admin'), getPlatformStats);

export default router;
