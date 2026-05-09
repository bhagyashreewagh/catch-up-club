import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import analyzeRouter from './routes/analyze.js';
import searchRouter from './routes/search.js';
import quizRouter from './routes/quiz.js';
import provostRouter from './routes/provost.js';
import translateRouter from './routes/translate.js';

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', name: 'The Catch Up Club API' }));
app.use('/api/analyze', analyzeRouter);
app.use('/api/search', searchRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/provost', provostRouter);
app.use('/api/translate', translateRouter);

// Serve built frontend in production
const frontendDist = join(__dirname, '../../frontend/dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => res.sendFile(join(frontendDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`🎓 The Catch Up Club backend running on http://localhost:${PORT}`);
});
