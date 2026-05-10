import { Router } from 'express';
import type { Request, Response } from 'express';
import { getClient } from '../utils/anthropicClient.js';
import type { StudyMaterials } from '../types.js';

const router = Router();

const SUPPORTED_LANGUAGES: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Mandarin Chinese',
  hi: 'Hindi',
  pt: 'Portuguese',
  ar: 'Arabic',
  ja: 'Japanese',
  ko: 'Korean',
  it: 'Italian',
};

router.post('/', async (req: Request, res: Response) => {
  const { study, language } = req.body as { study: StudyMaterials; language: string };

  if (!study || !language) {
    res.status(400).json({ error: 'Missing study materials or language code' });
    return;
  }

  const languageName = SUPPORTED_LANGUAGES[language];
  if (!languageName) {
    res.status(400).json({ error: `Unsupported language: ${language}` });
    return;
  }

  try {
    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: `You are a precise academic translator. Translate educational study materials into ${languageName}. Preserve all JSON structure, field names, IDs, timestamps, and numeric values exactly. Only translate human-readable text values (titles, summaries, questions, answers, hints, terms). Output only valid JSON.`,
      messages: [{
        role: 'user',
        content: `Translate all human-readable text in this JSON to ${languageName}. Keep all field names, IDs, timestamps, and numbers unchanged. Output only the translated JSON with no explanation:

${JSON.stringify(study, null, 2).slice(0, 60000)}`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: 'Translation returned malformed output' });
      return;
    }

    const translated = JSON.parse(jsonMatch[0]) as StudyMaterials;
    res.json({ study: translated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed';
    res.status(500).json({ error: message });
  }
});

export default router;
export { SUPPORTED_LANGUAGES };
