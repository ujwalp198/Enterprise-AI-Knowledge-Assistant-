import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/db';
import authRoutes from './routes/auth.routes';
import { requireAuth } from './middleware/auth.middleware';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/auth', authRoutes);

// TEMPORARY — just for testing auth. Remove after Day 3.
app.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});