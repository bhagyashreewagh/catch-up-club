import { Router } from 'express';
import type { Request, Response } from 'express';
import { runTranscriptAgent } from '../agents/transcriptAgent.js';
import { runCurriculumAgent } from '../agents/curriculumAgent.js';
import { segmentsToText } from '../utils/youtube.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { urls, objectives } = req.body as { urls: string[]; objectives: string[] };

  if (!urls?.length || !objectives?.length) {
    res.status(400).json({ error: 'Provide at least one URL and one learning objective.' });
    return;
  }
  if (urls.length > 10) {
    res.status(400).json({ error: 'Maximum 10 lecture URLs per analysis.' });
    return;
  }

  try {
    // Fetch all transcripts in parallel
    const results = await Promise.all(urls.map(url => runTranscriptAgent(url)));
    const videos = results.map(r => r.video);
    const transcripts = results.map(r => segmentsToText(r.segments));

    const provostResult = await runCurriculumAgent(videos, transcripts, objectives);
    res.json(provostResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    res.status(500).json({ error: message });
  }
});

export default router;
