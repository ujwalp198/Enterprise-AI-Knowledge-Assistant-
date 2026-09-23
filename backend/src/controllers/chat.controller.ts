import { Request, Response } from 'express';
import { z } from 'zod';
import { runQuery } from '../services/chat.service';

const querySchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
});

export async function query(req: Request, res: Response) {
  try {
    const { question } = querySchema.parse(req.body);

    const result = await runQuery({
      question,
      orgId: req.user!.orgId,
      userId: req.user!.userId,
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Query failed' });
  }
}
