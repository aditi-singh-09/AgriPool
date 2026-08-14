import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createListingSchema,
  updateListingSchema,
  listQuerySchema,
} from '../validators/listingValidators.js';
import {
  createListing,
  updateListing,
  getListing,
  listListings,
  deleteListing,
} from '../controllers/listingController.js';

const router = Router();

router.get('/', validate(listQuerySchema), listListings);
router.get('/:id', getListing);
router.post('/', requireAuth, validate(createListingSchema), createListing);
router.patch('/:id', requireAuth, validate(updateListingSchema), updateListing);
router.delete('/:id', requireAuth, deleteListing);

export default router;
