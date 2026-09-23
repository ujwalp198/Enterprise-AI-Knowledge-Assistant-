import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { query } from '../controllers/chat.controller';

const router = Router();

router.post('/query', requireAuth, query);

export default router;
