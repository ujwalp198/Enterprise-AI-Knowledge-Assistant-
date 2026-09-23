import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/db';
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import chatRoutes from './routes/chat.routes';

const app = express();
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
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
app.use('/documents', documentRoutes);
app.use('/chat', chatRoutes);

export default app;
