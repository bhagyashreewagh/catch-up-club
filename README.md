# The Catch Up Club
### *For the 11pm before every exam.*

A multi-agent AI system that turns any YouTube lecture into a complete study universe — in under a minute.

Built for the [Cloudforce No Resume Required hackathon](https://gocloudforce.com/no-resume-required-the-frontier-internship-powered-by-cloudforce/), May 2026.

---

## What it does

Paste a YouTube lecture URL. Five AI agents go to work in parallel:

| Agent | Job |
|---|---|
| **Transcript Agent** | Fetches and parses captions with timestamps |
| **Knowledge Agent** | Extracts concepts and maps relationships → Knowledge Constellation |
| **Study Agent** | Generates 20 flashcards, 3-depth summaries, and a timestamped outline |
| **Audit Agent** | (Faculty mode) Private pedagogical audit across 4 dimensions |
| **Curriculum Agent** | (Provost mode) Maps lectures against stated learning objectives |

### Three capabilities in one app

**Capability 1 — Student** (required, fully built)
- Embedded video player with concept markers on the timeline
- **Knowledge Constellation** — interactive force-directed graph of concept relationships; click any node to jump to that moment
- Hierarchical outline with timestamped jump-points
- Three summary depths: 90-second / 5-minute / comprehensive
- 20 exam-ready flashcards with flip animation and mastery tracking
- **Semantic search** — ask any question, find the exact moment in the lecture
- **Feynman Quiz** — AI generates questions, you answer in your own words, AI evaluates and gives feedback with source timestamps
- Bilingual: translate study materials (via Claude)

**Capability 2 — Faculty** (optional, fully built)
- Private audit across: Pedagogical quality, Accessibility, Clarity, Equity
- Score per dimension (0–100) with specific timestamped issues
- Top-priority improvement with suggested rewrite

**Capability 3 — Provost** (optional, fully built)
- Multi-URL input (up to 10 lectures)
- Paste learning objectives from your syllabus
- Coverage map: covered / partial / missing per objective with evidence timestamps

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                   │
│  Landing → ProcessingView → StudentView / FacultyView     │
│                         ProvostView                       │
└────────────────────────┬────────────────────────────────┘
                         │ SSE + REST API
┌────────────────────────▼────────────────────────────────┐
│              Express Backend (Node.js + TypeScript)       │
│                                                           │
│  GET /api/analyze   ← SSE stream, orchestrates agents    │
│  POST /api/search   ← Semantic search via Claude         │
│  POST /api/quiz/*   ← Generate + evaluate quiz questions │
│  POST /api/provost  ← Curriculum mapping (multi-URL)     │
│                                                           │
│  ┌─────────────────── Orchestrator ──────────────────┐  │
│  │                                                    │  │
│  │  [1] TranscriptAgent ──→ YouTube captions + meta  │  │
│  │                          ↓                         │  │
│  │  [2] KnowledgeAgent ─┐  (parallel)                │  │
│  │  [3] FacultyAgent  ──┘  (if faculty mode)         │  │
│  │                          ↓                         │  │
│  │  [4] StudyAgent ──→ flashcards + outline + summary │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│              Anthropic Claude claude-sonnet-4-6                       │
└─────────────────────────────────────────────────────────┘
```

**What makes the orchestration real:** Knowledge + Faculty agents run in parallel after the transcript is ready. The SSE stream lets the frontend show exactly which agent is active at any moment — not a spinner, an actual live command center.

---

## Running locally

### Prerequisites
- Node.js 18+
- An Anthropic API key

### Setup

```bash
# Clone and enter
cd /path/to/Lectio

# Backend
cd backend
npm install
# Add your API key to .env:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
echo "PORT=3001" >> .env
npm run dev   # starts on :3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # starts on :5173 (proxies /api to :3001)
```

Open http://localhost:5173 and paste any public YouTube lecture URL.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript (ESM) |
| AI | Anthropic Claude claude-sonnet-4-6 |
| YouTube | `youtube-transcript` (no API key needed) |
| Visualization | HTML5 Canvas, custom force-directed simulation |

---

## Judgment call on scope

I built all three capabilities because the architecture was already in place after Capability 1. The key decision was what NOT to ship:

- ❌ Vector embeddings (overengineering for this problem — Claude handles search better directly)
- ❌ Database / persistence (in-memory cache is sufficient for judging window)
- ❌ User accounts (not needed for the demo)
- ✅ Parallel agent execution (real value — Knowledge + Audit run simultaneously)
- ✅ The Constellation graph (the feature that makes this feel different)
- ✅ Feynman Quiz (the feature students actually need, not just more passive content)
