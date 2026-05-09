import { Router } from 'express';
import type { Request, Response } from 'express';
import { orchestrate } from '../agents/orchestrator.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const faculty = req.query.faculty === 'true';
  const language = (req.query.language as string) || 'en';

  if (!url) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  req.on('close', () => res.end());

  await orchestrate(url, faculty, language, res);
  res.end();
});

export default router;
