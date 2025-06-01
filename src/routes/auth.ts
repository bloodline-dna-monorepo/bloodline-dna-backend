import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { isDefaultAdmin } from '../middlewares/isDefaultAdmin';
import {
  registerHandler,
  loginHandler,
  requestPasswordChangeHandler,
  listPasswordChangeRequestsHandler,
  reviewPasswordChangeRequestHandler
} from '../controllers/authController';
import { changeUserRole } from '../controllers/adminController';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);

router.post('/password/request-change', authenticate, requestPasswordChangeHandler);

router.get('/password/requests', authenticate, isDefaultAdmin, listPasswordChangeRequestsHandler);
router.post('/password/review', authenticate, isDefaultAdmin, reviewPasswordChangeRequestHandler);

router.post('/account/change-role', authenticate, isDefaultAdmin, changeUserRole);

export default router;
