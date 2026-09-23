import { Router } from 'express';
import { register, login, refresh, getMe, invite, getOrgUsers } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', requireAuth, getMe);
router.get('/users', requireAuth, requireRole('ADMIN'), getOrgUsers);
router.get('/admin-only', requireAuth, requireRole('ADMIN'), (req, res) => {
  res.json({ message: 'Welcome, admin!', user: req.user });
});
router.post('/invite', requireAuth, requireRole('ADMIN'), invite);

export default router;