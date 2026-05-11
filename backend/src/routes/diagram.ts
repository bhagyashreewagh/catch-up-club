import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Catch-Up Club — Architecture Diagram</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F7F6F3; color: #1A1628; min-height: 100vh; padding: 40px 24px; }
  h1 { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #1A1628; }
  .subtitle { text-align: center; font-size: 13px; color: #818181; margin-bottom: 40px; }
  .diagram { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }

  /* Layers */
  .layer { display: flex; align-items: center; gap: 0; }
  .layer-label { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #818181; text-transform: uppercase; width: 28px; flex-shrink: 0; text-align: center; }
  .layer-content { flex: 1; display: flex; gap: 12px; padding: 16px; background: white; border-radius: 16px; border: 1.5px solid #E8E6E0; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }

  /* Boxes */
  .box { border-radius: 12px; padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; min-width: 140px; flex: 1; }
  .box-title { font-size: 13px; font-weight: 700; }
  .box-sub { font-size: 11px; opacity: 0.75; }
  .box-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.06em; opacity: 0.6; margin-top: 2px; }

  /* Colors */
  .teal   { background: #E6F4F3; border: 1.5px solid #32A29B; }
  .teal .box-title { color: #1A6B66; }
  .orange { background: #FDF0E6; border: 1.5px solid #B85A00; }
  .orange .box-title { color: #7C3D00; }
  .purple { background: #EEE8F8; border: 1.5px solid #7C5CBF; }
  .purple .box-title { color: #4A2B8C; }
  .gray   { background: #F4F3F0; border: 1.5px solid #C8C5BE; }
  .gray .box-title { color: #444; }
  .dark   { background: #1A1628; border: 1.5px solid #1A1628; }
  .dark .box-title { color: #fff; }
  .dark .box-sub { color: rgba(255,255,255,0.6); }

  /* Arrow */
  .arrow { display: flex; align-items: center; justify-content: center; font-size: 20px; color: #B85A00; flex-shrink: 0; padding: 0 4px; }
  .arrow-down { text-align: center; font-size: 20px; color: #B85A00; margin: -4px auto; line-height: 1; }

  /* SSE badge */
  .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; margin-top: 4px; letter-spacing: 0.05em; }
  .badge-sse { background: #FDF0E6; color: #B85A00; border: 1px solid #B85A00; }
  .badge-http { background: #E6F4F3; color: #32A29B; border: 1px solid #32A29B; }
  .badge-api { background: #EEE8F8; color: #7C5CBF; border: 1px solid #7C5CBF; }

  /* Parallel block */
  .parallel { display: flex; gap: 12px; flex: 1; flex-wrap: wrap; }
  .parallel-label { font-size: 10px; font-weight: 700; color: #818181; text-transform: uppercase; letter-spacing: 0.08em; text-align: center; margin-bottom: 6px; }
  .parallel-wrap { border: 1.5px dashed #C8C5BE; border-radius: 12px; padding: 10px 12px; flex: 1; }

  .legend { max-width: 900px; margin: 24px auto 0; display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #636363; }
  .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
</style>
</head>
<body>

<h1>⚡ Catch-Up Club</h1>
<p class="subtitle">Multi-Agent Architecture · Built for Cloudforce Frontier Internship Hackathon 2026</p>

<div class="diagram">

  <!-- USER -->
  <div class="layer">
    <div class="layer-label">User</div>
    <div class="layer-content">
      <div class="box teal">
        <div class="box-title">Student</div>
        <div class="box-sub">Pastes YouTube lecture URL</div>
        <div class="box-sub">Reads summaries, flashcards, outline</div>
        <div class="box-sub">Searches lecture semantically</div>
        <div class="box-sub">Takes Socratic quiz</div>
      </div>
      <div class="box orange">
        <div class="box-title">Faculty</div>
        <div class="box-sub">Pastes own lecture URL</div>
        <div class="box-sub">Reviews private pedagogical audit</div>
        <div class="box-sub">Gets timestamped fix suggestions</div>
      </div>
    </div>
  </div>

  <div class="arrow-down">↓</div>

  <!-- FRONTEND -->
  <div class="layer">
    <div class="layer-label">Frontend</div>
    <div class="layer-content">
      <div class="box purple" style="flex:2">
        <div class="box-title">React 18 + Vite — catch-up-club.onrender.com</div>
        <div class="box-sub">Landing → URL input + language selector + Faculty toggle</div>
        <div class="box-sub">ProcessingView → live agent status via SSE stream</div>
        <div class="box-sub">StudentView → outline, summaries (3 depths), flashcards, semantic search, quiz</div>
        <div class="box-sub">FacultyView → audit scores + prioritized fix list</div>
        <span class="badge badge-sse">SSE streaming</span>
        <span class="badge badge-http">REST /api/search · /api/quiz</span>
      </div>
    </div>
  </div>

  <div class="arrow-down">↓ SSE + REST</div>

  <!-- BACKEND -->
  <div class="layer">
    <div class="layer-label">Backend</div>
    <div class="layer-content" style="flex-direction:column; align-items:stretch;">
      <div class="box dark" style="min-width:unset;">
        <div class="box-title">Express + TypeScript (Node 20) · Port 3001</div>
        <div class="box-sub">GET /api/analyze → SSE stream · POST /api/search · POST /api/quiz/generate · POST /api/quiz/evaluate · GET /api/provost</div>
        <div class="box-sub" style="margin-top:6px;">In-memory analysis cache keyed by videoId:language:mode</div>
      </div>
    </div>
  </div>

  <div class="arrow-down">↓ Orchestrator</div>

  <!-- AGENTS -->
  <div class="layer">
    <div class="layer-label">Agents</div>
    <div class="layer-content" style="flex-direction:column; align-items:stretch; gap:12px;">

      <!-- Step 1: Transcript -->
      <div>
        <div class="parallel-label">Step 1 — Always first</div>
        <div class="box teal">
          <div class="box-title">🎙 Transcript Agent</div>
          <div class="box-sub">Fetches captions via Supadata API → fallback: youtube-transcript library</div>
          <div class="box-sub">Decodes entities · timestamps every segment · detects music / too-short / non-lecture</div>
          <div class="box-sub">Claude Haiku content classification guard (LECTURE vs OTHER)</div>
          <span class="badge badge-api">claude-haiku-4-5</span>
        </div>
      </div>

      <!-- Step 2: Parallel -->
      <div>
        <div class="parallel-label">Step 2 — Parallel execution</div>
        <div class="parallel">
          <div class="parallel-wrap">
            <div class="box orange">
              <div class="box-title">🧠 Knowledge Agent</div>
              <div class="box-sub">Extracts concepts + relationships</div>
              <div class="box-sub">Builds semantic concept graph</div>
              <div class="box-sub">Powers semantic search</div>
              <span class="badge badge-api">claude-sonnet-4-6</span>
            </div>
          </div>
          <div class="parallel-wrap">
            <div class="box teal" style="display:none"></div>
            <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
              <div class="box teal">
                <div class="box-title">📚 Study Agent <span style="font-size:10px;opacity:0.6">(Student mode only)</span></div>
                <div class="box-sub">Structured outline with timestamps</div>
                <div class="box-sub">3-depth summaries · flashcards · key terms</div>
                <div class="box-sub">Bilingual: EN + 10 languages</div>
                <span class="badge badge-api">claude-sonnet-4-6</span>
              </div>
              <div class="box orange">
                <div class="box-title">🎓 Audit Agent <span style="font-size:10px;opacity:0.6">(Faculty mode only)</span></div>
                <div class="box-sub">Scores Pedagogy · Accessibility · Equity · Clarity</div>
                <div class="box-sub">Prioritized fix list with timestamped rewrites</div>
                <span class="badge badge-api">claude-sonnet-4-6</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="arrow-down">↓</div>

  <!-- EXTERNAL -->
  <div class="layer">
    <div class="layer-label">External</div>
    <div class="layer-content">
      <div class="box gray">
        <div class="box-title">YouTube</div>
        <div class="box-sub">Supadata API (cloud)</div>
        <div class="box-sub">youtube-transcript (fallback)</div>
        <div class="box-sub">oEmbed + page scrape for video info</div>
        <div class="box-sub">YouTube IFrame API (player)</div>
      </div>
      <div class="box gray">
        <div class="box-title">Anthropic API</div>
        <div class="box-sub">claude-haiku-4-5 (classification)</div>
        <div class="box-sub">claude-sonnet-4-6 (all agents)</div>
        <div class="box-sub">Search · Quiz · Translate</div>
      </div>
      <div class="box gray">
        <div class="box-title">Render.com</div>
        <div class="box-sub">Single service — static + API</div>
        <div class="box-sub">Auto-deploy from GitHub main</div>
        <div class="box-sub">Node 20 runtime</div>
      </div>
    </div>
  </div>

</div>

<div class="legend">
  <div class="legend-item"><div class="legend-dot" style="background:#32A29B"></div> Student flow</div>
  <div class="legend-item"><div class="legend-dot" style="background:#B85A00"></div> Faculty flow</div>
  <div class="legend-item"><div class="legend-dot" style="background:#7C5CBF"></div> Frontend</div>
  <div class="legend-item"><div class="legend-dot" style="background:#1A1628"></div> Backend / Orchestrator</div>
  <div class="legend-item"><div class="legend-dot" style="background:#C8C5BE"></div> External services</div>
  <div class="legend-item">⚡ Catch-Up Club · 2026</div>
</div>

</body>
</html>`);
});

export default router;
