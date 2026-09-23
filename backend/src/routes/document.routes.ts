import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import upload from '../config/multer';
import {
  uploadDocument,
  getDocuments,
  getDocument,
} from '../controllers/document.controller';

const router = Router();

// 'file' must match the form-data field name sent by the client
router.post('/upload', requireAuth, upload.single('file'), uploadDocument);
router.get('/', requireAuth, getDocuments);
router.get('/:id', requireAuth, getDocument);

export default router;
