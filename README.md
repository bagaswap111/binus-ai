# BINUS AI — Adaptive Learning Platform

AI-powered adaptive learning platform for K-12 to university, with role-based expertise adaptation, policy-filtered model selection, and multi-layer conversation filtering.

## Architecture

```
Browser
  │ HTTPS
  ▼
Nginx (reverse proxy)
  ├── / → Next.js (:3000)      — App + API routes
  └── /health → AI Gateway     — FastAPI health check
                                        │
                              AI Gateway (:8000)
                                ├── PII Masking
                                ├── Prompt Injection Detector
                                ├── Content Policy (OPA Rego)
                                └── OpenAI / LLM Adapters
                                        │
                ┌───────────────────┼───────────────────┐
                ▼                   ▼                   ▼
          PostgreSQL            Redis               MinIO
          (data + vector)    (cache/rate-limit)   (file storage)
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend + API** | Next.js 16 (App Router, Turbopack, Tailwind CSS 4) |
| **AI Gateway** | Python 3.14+ / FastAPI 0.138 |
| **Database** | PostgreSQL 16 + Prisma 7 ORM |
| **Cache** | Redis 7 |
| **Policy Engine** | Open Policy Agent (OPA) |
| **File Storage** | MinIO / S3 |
| **Auth** | NextAuth v5 (JWT + Microsoft Entra ID SSO) |
| **Font** | Inter (sans) + JetBrains Mono |

## Project Structure

```
binus-ai/
├── apps/
│   ├── web/                     # Next.js application
│   │   ├── src/
│   │   │   ├── app/             # App Router (routes + pages)
│   │   │   │   ├── (auth)/      # Login, Register
│   │   │   │   ├── (dashboard)/ # Dashboard pages (chat, exams, etc.)
│   │   │   │   └── api/         # API routes
│   │   │   ├── auth.ts          # NextAuth configuration
│   │   │   ├── proxy.ts         # Edge auth middleware
│   │   │   ├── components/      # UI components
│   │   │   └── lib/             # Utilities (prisma, guards, security)
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   ├── Dockerfile
│   │   └── package.json
│   └── ai-gateway/              # FastAPI microservice
│       ├── app/
│       │   ├── main.py          # Entry point
│       │   └── filters/         # PII, injection, policy filters
│       ├── opa/                 # OPA Rego policies
│       ├── Dockerfile
│       └── requirements.txt
├── docker/
│   ├── docker-compose.yml       # Dev infra (postgres, redis, opa, minio)
│   ├── docker-compose.prod.yml  # Production stack
│   └── nginx.conf               # Reverse proxy config
├── scripts/
│   ├── start.sh                 # One-command dev startup
│   └── build-log.sh             # Build verification
├── .env.template
└── README.md
```

## Prerequisites

- **Node.js** ≥ 20.x (dev on 20.20.0)
- **npm** ≥ 10.x
- **Python** ≥ 3.12 (dev on 3.14.2)
- **PostgreSQL** 16
- **Docker** (optional, for infra services)
- **Git**

## Local Development

### 1. Clone & install

```bash
git clone <repo> && cd binus-ai

# Install web dependencies
npm install --prefix apps/web

# Setup Python virtual environment
cd apps/ai-gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### 2. Configure environment

```bash
cp .env.template apps/web/.env
# Edit apps/web/.env — set AUTH_SECRET, database URL, etc.
```

### 3. Start infrastructure (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Push schema & seed

```bash
cd apps/web
npx prisma db push --accept-data-loss
npx prisma generate
npx tsx prisma/seed.ts
cd ../..
```

### 5. Start services

```bash
bash scripts/start.sh
```

Or manually:

```bash
# Terminal 1: AI Gateway
cd apps/ai-gateway
source .venv/bin/activate
uvicorn app.main:app --port 8000 --reload

# Terminal 2: Next.js
cd apps/web
npx next dev -p 3000
```

Open **http://localhost:3000** — login with `admin@binus.edu` / `admin123`

### 6. Quick reset

```bash
# Drop and recreate database
psql -h localhost -U binus -d binus_ai -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd apps/web && npx prisma db push && npx tsx prisma/seed.ts
```

---

## Production Deployment

### Option A: Docker Compose (VPS)

Deploy full stack with a single command.

**Minimum VPS specs:** 2 vCPU, 4 GB RAM, 40 GB SSD

```bash
# 1. Clone on server
git clone <repo> && cd binus-ai

# 2. Set environment variables
export AUTH_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 32)
export MINIO_ACCESS_KEY=binus
export MINIO_SECRET_KEY=$(openssl rand -base64 32)

# 3. Build and start
docker compose -f docker/docker-compose.prod.yml up -d --build

# 4. Push schema & seed (first time only)
docker compose -f docker/docker-compose.prod.yml exec nextjs npx prisma db push
docker compose -f docker/docker-compose.prod.yml exec nextjs npx tsx prisma/seed.ts

# 5. Check logs
docker compose -f docker/docker-compose.prod.yml logs -f
```

**Update after code changes:**
```bash
git pull
docker compose -f docker/docker-compose.prod.yml up -d --build
```

### Option B: VPS with PM2 (lighter)

For servers without Docker or lower specs.

**Minimum VPS specs:** 2 vCPU, 4 GB RAM, 40 GB SSD

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y nodejs npm python3 python3-venv postgresql nginx certbot

# 2. Clone repo
git clone <repo> && cd binus-ai

# 3. Setup database
sudo -u postgres createdb binus_ai
sudo -u postgres psql -c "CREATE USER binus WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE binus_ai TO binus;"

# 4. Install app deps
npm install --prefix apps/web

cd apps/ai-gateway
python3 -m venv .venv
source .venv/bin/activate && pip install -r requirements.txt
cd ../..

# 5. Build web app
cd apps/web && npx prisma generate && npx next build && cd ../..

# 6. Start with PM2
npm install -g pm2

pm2 start apps/ai-gateway/.venv/bin/python --name "gateway" \
  -- -m uvicorn app.main:app --port 8000 --host 0.0.0.0

pm2 start apps/web/node_modules/.bin/next --name "nextjs" \
  -- start -p 3000

pm2 save
pm2 startup

# 7. Nginx reverse proxy (with SSL)
sudo nano /etc/nginx/sites-available/binus-ai
sudo ln -s /etc/nginx/sites-available/binus-ai /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

**Nginx config** (`/etc/nginx/sites-available/binus-ai`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }
}
```

### Option C: Hybrid (Vercel + VPS)

Optimal for cost — Next.js on Vercel, Gateway + DB on small VPS.

| Service | Hosting | Est. Cost |
|---|---|---|
| Next.js | Vercel (Hobby) | Free |
| AI Gateway | VPS 1 vCPU / 2GB | ~$6-10/mo |
| PostgreSQL | Neon / Supabase | Free tier |
| File storage | MinIO on VPS | ~$5/mo |

```bash
# Deploy Next.js to Vercel
npx vercel --prod

# Set environment variables in Vercel dashboard:
# - GATEWAY_URL: https://your-vps.com:8000
# - DATABASE_URL: from Neon/Supabase
# - AUTH_SECRET, AUTH_URL, etc.

# Deploy Gateway on VPS
scp -r apps/ai-gateway root@your-vps:/opt/gateway
ssh root@your-vps
cd /opt/gateway
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
# Setup systemd or pm2 to run uvicorn on port 8000
```

### Option D: Cloud (AWS/GCP/Azure) — Enterprise

| Service | AWS | GCP | Azure |
|---|---|---|---|
| Next.js | ECS Fargate / Amplify | Cloud Run | App Service |
| Gateway | ECS Fargate | Cloud Run | Container Apps |
| Database | RDS PostgreSQL | Cloud SQL | Azure DB PostgreSQL |
| Cache | ElastiCache Redis | Memorystore Redis | Azure Cache Redis |
| Storage | S3 | Cloud Storage | Blob Storage |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | — | NextAuth encryption key (`openssl rand -base64 32`) |
| `AUTH_URL` | ✅ | `http://localhost:3000` | App public URL |
| `GATEWAY_URL` | ✅ | `http://localhost:8000` | AI Gateway URL |
| `REDIS_URL` | — | `redis://localhost:6379` | Redis connection |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | — | — | Microsoft Entra ID client ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | — | — | Microsoft Entra ID client secret |
| `MINIO_ENDPOINT` | — | `localhost:9000` | MinIO/S3 endpoint |
| `MINIO_ACCESS_KEY` | — | `binus` | MinIO access key |
| `MINIO_SECRET_KEY` | — | `binus_dev` | MinIO secret key |
| `MINIO_BUCKET` | — | `binus-ai` | MinIO bucket name |
| `OPENAI_API_KEY` | — | — | OpenAI API key (chat model) |

## Database

### Schema

17 models managed via Prisma: User, School, Subject, KnowledgeBase, ChatSession, Message, Project, ProjectFile, Exam, ExamResult, ProctoringViolation, QuestionBank, StudyGroup, StudyGroupMember, GroupMessage, DiscussionForum, DiscussionPost, ModelRegistry.

### Commands

```bash
# Push schema (dev — no migration files)
cd apps/web && npx prisma db push --accept-data-loss

# Generate client after schema changes
npx prisma generate

# View database in browser
npx prisma studio

# Seed data
npx tsx prisma/seed.ts
```

## Features

### Batch A — Foundation
- Auth & roles (SD/SMP/SMA/S1/S2/S3/TEACHER/LECTURER/ADMIN)
- Chat AI with role-based prompts & streaming
- AI Gateway with 3-layer filter (PII, injection, content policy)
- Subject agents with knowledge base RAG
- Project folders with file upload
- Admin panel with model registry
- Microsoft Entra ID SSO

### Batch B — Learning
- Exam creation & AI grading with rubric
- Proctoring (browser lockdown + violation logging)
- Question bank with Bloom taxonomy (C1-C6)
- Plagiarism checker (word-overlap similarity)
- Academic writing (literature review, citation, IMRaD, thesis outline)
- Teaching tools (RPS/syllabus generator, learning path)
- Collaboration (study groups, discussion forums, AI moderation)
- Learning analytics (grade distribution, knowledge gap analyzer)

## Routes

**52 routes total** — 23 pages + 29 API endpoints.

### Pages
`/dashboard`, `/chat`, `/subjects`, `/projects`, `/projects/[id]`, `/exams`, `/exams/create`, `/exams/[id]`, `/exams/[id]/take`, `/exams/[id]/results`, `/questions`, `/plagiarism`, `/academic`, `/teaching`, `/collaboration`, `/analytics`, `/admin`

### API
`/api/auth/[...nextauth]`, `/api/register`, `/api/schools`, `/api/dashboard`, `/api/chat`, `/api/chat/[sessionId]`, `/api/sessions`, `/api/subjects`, `/api/knowledge`, `/api/projects`, `/api/projects/[id]`, `/api/exams`, `/api/exams/[id]`, `/api/exams/[id]/submit`, `/api/exams/[id]/auto-grade`, `/api/exams/[id]/grade`, `/api/exams/[id]/results`, `/api/exams/[id]/violations`, `/api/questions`, `/api/plagiarism`, `/api/academic/literature`, `/api/academic/citation`, `/api/academic/outline`, `/api/academic/structure`, `/api/teaching/syllabus`, `/api/teaching/learning-path`, `/api/groups`, `/api/groups/[id]/join`, `/api/groups/[id]/messages`, `/api/forums`, `/api/forums/[id]/posts`, `/api/admin/models`, `/api/analytics/grades`, `/api/analytics/knowledge-gaps`

## Security

- **Edge auth middleware** — JWT verification on every request via proxy.ts
- **AI Gateway filters** — PII masking (NIM/NISN, NIK), prompt injection detection, content policy (OPA Rego)
- **Rate limiting** — in-memory limiter on `/api/chat`
- **XSS sanitization** — input sanitizer on chat endpoint
- **Role-based access** — route guards at API + UI level
- **Domain-restricted SSO** — only @binus.ac.id for Microsoft login

## Development Notes

- **pnpm not supported** — using npm workspaces (Node v20.20.0 requires pnpm ≥10 which needs v22)
- **Prisma 7** — uses `PrismaPg` adapter with `Pool` (no `datasourceUrl` in constructor)
- **Next.js 16** — `middleware.ts` renamed to `proxy.ts`, Turbopack is default (`--no-turbopack` not available)
- **Theme** — light/dark mode with localStorage persistence, Inter font
- **No migrations** — use `prisma db push` for dev (simpler, no migration files)

## License

Internal — BINUS University
