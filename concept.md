# Konsep Aplikasi Web AI Pendidikan
## BINUS AI — Adaptive Learning Platform (K-12 s.d. Universitas)

---

## 1. Visi & Misi

**Visi:** Platform AI pendidikan terpadu yang mengakomodasi seluruh jenjang pendidikan dari SD hingga universitas, dengan keamanan data dan kepatuhan kebijakan institusi sebagai fondasi utama.

**Misi:**
- Menyediakan asisten AI yang menyesuaikan tingkat kepakaran berdasarkan peran pengguna (siswa, mahasiswa, guru, dosen)
- Memberikan kontrol penuh kepada institusi atas model AI yang digunakan dan kebijakan penggunaannya
- Melindungi data pengguna dengan filtering berlapis sebelum data meninggalkan lingkungan institusi
- Meningkatkan kualitas pembelajaran melalui fitur adaptif, kolaboratif, dan berbasis data

---

## 2. Arsitektur Teknologi

### 2.1 Tech Stack

| Lapisan | Teknologi | Alasan |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui | SSR untuk SEO, RSC untuk performa, ekosistem React matang |
| **API Umum** | Next.js API Routes | Satu codebase dengan frontend, deployment sederhana |
| **AI Gateway** | FastAPI (Python) | Ekosistem ML/NLP terlengkap (spaCy, ONNX, transformers, OPA) |
| **Database** | PostgreSQL + Prisma ORM | Reliable, relational, dukungan vector via pgvector |
| **Cache & Rate Limit** | Redis | In-memory cepat untuk session, rate limiter, pub/sub realtime |
| **Vector Store** | pgvector | Satu database dengan data utama, tanpa infrastruktur tambahan |
| **File Storage** | MinIO / AWS S3 | Object storage untuk project files, submission, gambar |
| **Auth** | NextAuth.js + SSO (LDAP/SAML/Google) | Support universitas, multi-provider, JWT session |
| **Real-time** | WebSocket (Socket.io) | Chat, kolaborasi study group, notifikasi |
| **Policy Engine** | Open Policy Agent (OPA) | Policy-as-code, decoupled dari aplikasi, audit trail |
| **Model Lokal** | Ollama / vLLM | Hosting model open-source on-premise |
| **Monitoring** | Langfuse / LangSmith | Observability LLM: latency, cost, token usage, quality |
| **Deployment** | Docker + Docker Compose | Portable, development-production parity |

### 2.2 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  Browser / Mobile Web                                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS / WSS
┌───────────────────────────────▼─────────────────────────────────────┐
│                      NEXT.JS APPLICATION                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  App Router (React Server Components)                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │ Chat UI  │ │ Project  │ │ Subject  │ │ Dashboard &      │  │ │
│  │  │          │ │ Explorer │ │ Agents   │ │ Admin Panel      │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  API Routes                                                    │ │
│  │  /api/auth/*  /api/chat/*  /api/projects/*  /api/subjects/*     │ │
│  │  /api/assignments/*  /api/exams/*  /api/study-groups/*          │ │
│  │  /api/ai/*       → proxy ke AI Gateway                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP (internal network)
┌───────────────────────────────▼─────────────────────────────────────┐
│                      AI GATEWAY (FASTAPI - PYTHON)                    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  PRE-FILTER PIPELINE (berurutan, fail-fast)                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │  1. PII  │→│  2.      │→│  3.      │→│  4.      │→ ... →   │ │
│  │  │  Masking │ │  Prompt  │ │Academic  │ │Content   │          │ │
│  │  │ (Presidio│ │Injection │ │Integrity │ │Policy    │          │ │
│  │  │  + Regex)│ │Detector  │ │Gate      │ │(OPA Rego)│          │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │  │  5.      │→│  6.      │→│  7. Cost │→│  8.      │→ ... →   │ │
│  │  │ Profanity│ │  Topic   │ │  Router  │ │ Context  │          │ │
│  │  │ Filter   │ │ Guardrail│ │          │ │Optimizer │          │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  MODEL ROUTER                                                    │ │
│  │  Input: user_id, role, subject, filtered_prompt, cost_budget     │ │
│  │  Output: model_id, provider, endpoint, parameters                │ │
│  │  Dicision: Policy OPA → Cost Optimizer → Availability Check     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  MODEL ADAPTERS (Provider Abstraction)                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │ OpenAI   │ │ Anthropic│ │ Google   │ │ Ollama/vLLM      │  │ │
│  │  │ Adapter  │ │ Adapter  │ │ Gemini   │ │ (Local Models)   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  POST-FILTER PIPELINE                                           │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │ │
│  │  │Response  │→│ Toxicity │→│  Brand   │→│  Logging &       │  │ │
│  │  │Sanitizer │ │ Re-check │ │ Inject   │ │  Monitoring      │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Cloud AI APIs   │   │  Cloud Vertex   │   │  On-Premise     │
│  OpenAI / Claude │   │  AI / Azure     │   │  Ollama / vLLM  │
│  / Gemini        │   │  OpenAI         │   │  (GPU Server)   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 2.3 Struktur Direktori

```
binus-ai/
├── apps/
│   ├── web/                          # Next.js application
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── callback/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── chat/
│   │   │   │   ├── projects/
│   │   │   │   ├── subjects/
│   │   │   │   ├── exams/
│   │   │   │   ├── assignments/
│   │   │   │   ├── study-groups/
│   │   │   │   ├── analytics/
│   │   │   │   ├── literature-review/
│   │   │   │   ├── quiz-generator/
│   │   │   │   ├── syllabus-generator/
│   │   │   │   ├── plagiarism-checker/
│   │   │   │   ├── career-advisor/
│   │   │   │   └── admin/
│   │   │   │       ├── models/
│   │   │   │       ├── policies/
│   │   │   │       ├── users/
│   │   │   │       └── audit-logs/
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       ├── chat/
│   │   │       ├── projects/
│   │   │       ├── subjects/
│   │   │       ├── assignments/
│   │   │       ├── exams/
│   │   │       ├── study-groups/
│   │   │       ├── admin/
│   │   │       └── ai/              # Proxy ke AI Gateway
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── chat/
│   │   │   ├── projects/
│   │   │   ├── editor/             # Rich text / LaTeX editor
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── auth.ts
│   │   │   ├── ai-client.ts        # HTTP client ke AI Gateway
│   │   │   ├── utils.ts
│   │   │   └── validators/
│   │   ├── stores/                  # Zustand state management
│   │   ├── hooks/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   │
│   └── ai-gateway/                  # Python FastAPI microservice
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py              # FastAPI entry point
│       │   ├── config.py            # Settings via pydantic-settings
│       │   ├── routers/
│       │   │   ├── __init__.py
│       │   │   ├── chat.py          # Chat completion endpoint
│       │   │   ├── models.py        # Model registry CRUD
│       │   │   ├── policies.py      # Policy management
│       │   │   ├── health.py        # Health check
│       │   │   └── admin.py         # Admin operations
│       │   ├── filters/
│       │   │   ├── __init__.py
│       │   │   ├── base.py          # Abstract base filter
│       │   │   ├── pipeline.py      # Pipeline orchestrator
│       │   │   ├── pre_filter/
│       │   │   │   ├── __init__.py
│       │   │   │   ├── pii.py
│       │   │   │   ├── prompt_injection.py
│       │   │   │   ├── academic_integrity.py
│       │   │   │   ├── content_policy.py
│       │   │   │   ├── profanity.py
│       │   │   │   ├── topic_guardrail.py
│       │   │   │   ├── cost_router.py
│       │   │   │   ├── context_optimizer.py
│       │   │   │   └── rate_limiter.py
│       │   │   └── post_filter/
│       │   │       ├── __init__.py
│       │   │       ├── sanitizer.py
│       │   │       ├── toxicity_check.py
│       │   │       └── brand_inject.py
│       │   ├── models/              # AI Model adapters
│       │   │   ├── __init__.py
│       │   │   ├── base.py
│       │   │   ├── openai.py
│       │   │   ├── anthropic.py
│       │   │   ├── gemini.py
│       │   │   ├── azure_openai.py
│       │   │   └── ollama.py
│       │   ├── policies/
│       │   │   ├── model_selection.rego
│       │   │   ├── content_filter.rego
│       │   │   ├── academic_integrity.rego
│       │   │   └── data_residency.rego
│       │   └── core/
│       │       ├── security.py
│       │       ├── logging.py
│       │       ├── metrics.py
│       │       └── exceptions.py
│       ├── models/                  # ML models (ONNX, spaCy)
│       │   ├── spacy/               # PII NER model
│       │   ├── toxicity/            # Toxicity classifier
│       │   └── prompt_injection/    # Injection detector
│       ├── tests/
│       ├── requirements.txt
│       ├── Dockerfile
│       └── docker-compose.yml       # Redis, OPA, dll
│
└── packages/
    └── shared/                      # Shared TypeScript types
        ├── types/
        │   ├── chat.ts
        │   ├── user.ts
        │   ├── project.ts
        │   ├── subject.ts
        │   ├── exam.ts
        │   ├── assignment.ts
        │   ├── policy.ts
        │   └── model.ts
        ├── validators/
        └── constants/
```

---

## 3. Database Schema (Prisma)

### 3.1 Entity Relationship Diagram (Textual)

```
User ──< Project
User ──< ChatSession
User ──< Submission
User ──< ExamResult
User ──< StudyGroupMember
User >── Role (enum: SD, SMP, SMA, S1, S2, S3, TEACHER, LECTURER, ADMIN)

School/University ──< User
School/University ──< Subject
School/University ──< Policy
School/University ──< ModelRegistry

Subject ──< Project
Subject ──< ChatSession
Subject ──< Assignment
Subject ──< Exam
Subject ──< SubjectAgent

ChatSession ──< Message
Project ──< ProjectFile
Assignment ──< Submission
Exam ──< ExamResult
StudyGroup ──< StudyGroupMember
StudyGroup ──< StudyGroupMessage
```

### 3.2 Schema Detail

```prisma
// ==================== ENUMS ====================

enum UserRole {
  SD       // Siswa SD
  SMP      // Siswa SMP
  SMA      // Siswa SMA
  S1       // Mahasiswa S1
  S2       // Mahasiswa S2
  S3       // Mahasiswa S3
  TEACHER  // Guru
  LECTURER // Dosen
  ADMIN    // Admin sistem/sekolah
  SUPER_ADMIN
}

enum ModelProvider {
  OPENAI
  ANTHROPIC
  GOOGLE
  AZURE_OPENAI
  OLLAMA
  CUSTOM
}

enum ModelCapability {
  CHAT
  CODE
  IMAGE_GENERATION
  IMAGE_UNDERSTANDING
  WEB_SEARCH
  FUNCTION_CALLING
  DOCUMENT_PARSING
  MATH_REASONING
}

enum FilterAction {
  ALLOW
  BLOCK
  FLAG
  REDIRECT
  MODIFY
}

enum SubjectCategory {
  MATEMATIKA
  FISIKA
  KIMIA
  BIOLOGI
  BAHASA_INDONESIA
  BAHASA_INGGRIS
  SEJARAH
  GEOGRAFI
  EKONOMI
  SOSIOLOGI
  PKN
  AGAMA
  SENI_BUDAYA
  PJOK
  INFORMATIKA
  TEKNIK
  KEDOKTERAN
  HUKUM
  BISNIS
  PSIKOLOGI
  LAINNYA
}

// ==================== MODELS ====================

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String
  role          UserRole
  nimNisn       String?        // NIM/NISN
  gradeLevel    Int?           // Tingkat kelas (1-12) atau semester
  schoolId      String
  school        School         @relation(fields: [schoolId], references: [id])
  image         String?

  // Preferences
  preferredModelId String?

  // Relations
  projects        Project[]
  chatSessions    ChatSession[]
  submissions     Submission[]
  examResults     ExamResult[]
  studyMemberships StudyGroupMember[]
  assignments     Assignment[]     @relation("TeacherAssignments")
  subjectsTaught  Subject[]       @relation("TeacherSubjects")

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model School {
  id          String   @id @default(cuid())
  name        String
  domain      String   @unique
  type        String   // SD, SMP, SMA, UNIVERSITAS
  ssoConfig   Json?    // SSO LDAP/SAML configuration
  address     String?
  logo        String?

  users       User[]
  subjects    Subject[]
  policies    Policy[]
  models      ModelRegistry[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Subject {
  id              String          @id @default(cuid())
  name            String
  code            String          // e.g. MATH101
  category        SubjectCategory
  description     String?
  gradeLevel      Int?
  curriculumVersion String?
  schoolId        String
  school          School          @relation(fields: [schoolId], references: [id])
  teacherId       String?
  teacher         User?           @relation("TeacherSubjects", fields: [teacherId], references: [id])

  // AI Agent Configuration
  agentPrompt     String?         // System prompt khusus untuk agent ini
  agentModelId    String?         // Model default untuk subject ini
  allowedModelIds String[]        // Model yang diizinkan untuk subject ini

  projects        Project[]
  chatSessions    ChatSession[]
  assignments     Assignment[]
  exams           Exam[]
  studyGroups     StudyGroup[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  subjectId   String?
  subject     Subject?      @relation(fields: [subjectId], references: [id])
  isPublic    Boolean       @default(false)
  tags        String[]

  files       ProjectFile[]
  chatSessions ChatSession[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model ProjectFile {
  id          String   @id @default(cuid())
  name        String
  type        String   // pdf, docx, image, code, etc.
  url         String   // S3/MinIO URL
  size        Int      // bytes
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])

  createdAt   DateTime @default(now())
}

model ChatSession {
  id          String    @id @default(cuid())
  title       String?
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  subjectId   String?
  subject     Subject?  @relation(fields: [subjectId], references: [id])
  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id])
  modelId     String?   // Model yang digunakan sesi ini

  messages    Message[]
  isArchived  Boolean   @default(false)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Message {
  id              String   @id @default(cuid())
  sessionId       String
  session         ChatSession @relation(fields: [sessionId], references: [id])
  role            String   // user, assistant, system, tool
  content         String   // Original content
  filteredContent String?  // Content after pre-filter (for user messages)
  responseFiltered String? // Content after post-filter (for assistant messages)

  // Metadata
  tokenCount      Int?
  modelUsed       String?
  latency         Int?     // ms
  cost            Float?
  filterActions   Json?    // Array of filter actions applied
  piiRedacted     Boolean  @default(false)
  riskScore       Float?   // 0-1

  createdAt       DateTime @default(now())
}

model Assignment {
  id          String       @id @default(cuid())
  title       String
  description String?
  subjectId   String
  subject     Subject      @relation(fields: [subjectId], references: [id])
  teacherId   String
  teacher     User         @relation("TeacherAssignments", fields: [teacherId], references: [id])
  deadline    DateTime?
  rubric      Json?        // Rubrik penilaian
  maxScore    Int?
  aiGrading   Boolean      @default(false)

  submissions Submission[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Submission {
  id           String   @id @default(cuid())
  assignmentId String
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  fileUrl      String?
  content      String?  // Text content if not file
  score        Int?
  aiFeedback   String?  // AI-generated feedback
  teacherFeedback String?
  plagiarismScore Float?
  status       String   @default("submitted") // submitted, graded, returned

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Exam {
  id              String        @id @default(cuid())
  title           String
  subjectId       String
  subject         Subject       @relation(fields: [subjectId], references: [id])
  questions       Json          // Array of questions with answers
  duration        Int?          // minutes
  identityFilter  Boolean       @default(true) // Filter identitas di jawaban
  shuffleQuestions Boolean      @default(false)
  maxAttempts     Int           @default(1)
  startTime       DateTime?
  endTime         DateTime?
  passingScore    Int?
  aiGrading       Boolean       @default(true)

  results         ExamResult[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model ExamResult {
  id          String   @id @default(cuid())
  examId      String
  exam        Exam     @relation(fields: [examId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  answers     Json     // User's answers
  score       Int?
  aiGrading   Json?    // AI grading details per question
  identities  Json?    // Identitas yang terdeteksi (jika identityFilter aktif)
  startTime   DateTime
  endTime     DateTime?
  status      String   @default("in_progress") // in_progress, submitted, graded

  createdAt   DateTime @default(now())
}

model StudyGroup {
  id          String              @id @default(cuid())
  name        String
  description String?
  subjectId   String?
  subject     Subject?            @relation(fields: [subjectId], references: [id])
  creatorId   String
  isAiModerated Boolean           @default(true)
  maxMembers  Int                 @default(30)

  members     StudyGroupMember[]
  messages    StudyGroupMessage[]

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

model StudyGroupMember {
  id          String      @id @default(cuid())
  groupId     String
  group       StudyGroup  @relation(fields: [groupId], references: [id])
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  role        String      @default("member") // member, moderator, admin

  joinedAt    DateTime    @default(now())
}

model StudyGroupMessage {
  id          String      @id @default(cuid())
  groupId     String
  group       StudyGroup  @relation(fields: [groupId], references: [id])
  userId      String
  content     String
  moderatedContent String? // Jika AI moderation aktif
  isFlagged   Boolean     @default(false)

  createdAt   DateTime    @default(now())
}

// ==================== POLICY & MODEL MANAGEMENT ====================

model Policy {
  id          String   @id @default(cuid())
  name        String
  description String?
  schoolId    String
  school      School   @relation(fields: [schoolId], references: [id])
  type        String   // model_selection, content_filter, data_residency, rate_limit
  rules       Json     // Policy rules (JSON format compatible with OPA)
  priority    Int      @default(0) // Higher = applied first
  isActive    Boolean  @default(true)
  applyToRoles UserRole[] // Roles this policy applies to (empty = all)
  applyToSubjects SubjectCategory[] // Subjects this policy applies to (empty = all)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ModelRegistry {
  id              String           @id @default(cuid())
  name            String           // Display name
  modelId         String           // Provider's model ID (e.g. "gpt-4o")
  provider        ModelProvider
  providerUrl     String?          // Custom endpoint for Ollama/Custom
  capabilities    ModelCapability[]
  maxTokens       Int
  costPerInput    Float            // per 1K tokens
  costPerOutput   Float            // per 1K tokens
  isLocal         Boolean          @default(false) // On-premise model
  isActive        Boolean          @default(true)

  schoolId        String
  school          School           @relation(fields: [schoolId], references: [id])
  allowedRoles    UserRole[]       // Roles that can use this model
  allowedSubjects SubjectCategory[]
  minGradeLevel   Int?             // Minimum grade level
  requireApproval Boolean          @default(false) // Requires admin approval

  // Rate limits per model
  rateLimitRPM    Int?             // Requests per minute per user
  rateLimitTPM    Int?             // Tokens per minute per user

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

// ==================== ANALYTICS & LOGGING ====================

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String   // chat, filter_trigger, policy_block, model_switch, etc.
  resource    String?  // e.g. "chat:session_id", "model:gpt-4o"
  details     Json?    // Action details
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())
}

model UsageMetric {
  id          String   @id @default(cuid())
  schoolId    String
  userId      String?
  modelId     String
  action      String   // chat, grading, quiz_generation, etc.
  tokenCount  Int
  cost        Float
  latency     Int      // ms
  success     Boolean  @default(true)

  createdAt   DateTime @default(now())
}
```

---

## 4. Fitur Detail

### 4.1 Chat AI dengan Role-Based Expertise Adaptation

| Aspek | SD/SMP | SMA | S1 | S2/S3 | Guru/Dosen |
|---|---|---|---|---|---|
| **Gaya bahasa** | Sederhana, ramah anak | Semi-formal | Formal akademik | Formal + terminologi spesifik | Formal administratif |
| **Panjang response** | Pendek (2-3 kalimat) | Sedang (1 paragraf) | Panjang (2-3 paragraf) | Sangat panjang + referensi | Variatif tergantung konteks |
| **Rumus & simbol** | Minimal, visual | Mulai diperkenalkan | LaTeX, notasi baku | Detail + derivasi | Admin tools |
| **Sumber referensi** | Tidak ada | Link umum | DOI, jurnal | Jurnal primer + review | Kebijakan institusi |
| **Web search** | Diblokir | Dibatasi domain | Diizinkan | Diizinkan | Diizinkan |
| **Gambar/visual** | Ilustrasi edukatif | Diagram + grafik | Grafik + tabel | Data visualization | Template, rubrik |
| **Mode khusus** | Gamifikasi, storytelling | Contoh soal UN/SBMPTN | Skripsi guidance | Research mentor | RPS generator, grade analyzer |

**Implementasi:**
Setiap role memiliki **system prompt template** berbeda yang di-inject secara otomatis oleh AI Gateway. Template disimpan di database dan dapat dikustomisasi oleh admin sekolah.

```python
# Contoh system prompt template per role
SYSTEM_PROMPTS = {
    "SD": "Kamu adalah asisten belajar yang ramah untuk siswa SD. "
          "Gunakan bahasa yang sederhana dan mudah dipahami anak-anak. "
          "Berikan penjelasan dengan contoh dari kehidupan sehari-hari. "
          "Jangan gunakan kata-kata sulit tanpa menjelaskannya. "
          "Gunakan emoji secukupnya untuk membuat belajar menyenangkan. "
          "{subject_context}",

    "S1": "Kamu adalah asisten akademik untuk mahasiswa S1. "
          "Berikan penjelasan yang mendalam dengan referensi akademik. "
          "Gunakan terminologi yang tepat dan berikan definisi. "
          "Jika relevan, sertakan DOI jurnal atau sumber terpercaya. "
          "Dukung jawaban dengan data dan penelitian terbaru. "
          "Format rumus matematika menggunakan LaTeX. "
          "{subject_context}",

    "LECTURER": "Kamu adalah asisten untuk dosen dalam kegiatan akademik. "
                "Berikan bantuan dalam: menyusun RPS, membuat soal ujian, "
                "mengevaluasi kurikulum, analisis nilai mahasiswa, "
                "dan penelitian. Gunakan bahasa formal dan referensi "
                "pendidikan tinggi. {subject_context}",
}
```

### 4.2 Fitur Tambahan (di luar Chat, Project Folder, Subject Agent, Exam Correction)

---

#### 4.2.1 Asesmen & Evaluasi

**A. Adaptive Quiz Generator**
- **Cara kerja:** Dosen input topik + jumlah soal + tingkat kesulitan → AI generate soal pilihan ganda/esai lengkap dengan kunci jawaban.
- **Adaptif:** Sistem tracking jawaban siswa → soal berikutnya menyesuaikan tingkat kesulitan (layaknya Computerized Adaptive Testing/CAT).
- **Bloom Taxonomy tagging:** Setiap soal ditag dengan level kognitif (C1-C6).
- **Output:** Bisa diekspor ke PDF, Excel, atau langsung diimpor ke Exam module.

**B. Plagiarism Checker**
- **Internal:** Cek kemiripan antar submission dalam satu kelas/sekolah.
- **Eksternal:** Cek terhadap database jurnal, artikel, dan repositori (API Turnitin/PlagScan atau model embedding lokal).
- **Cara kerja:** Dokumen di-*embedding* → cosine similarity → report percentage + highlighted sections.
- **Privacy:** Dokumen tidak dikirim ke server eksternal (embedding dilakukan on-premise).

**C. Rubric Generator**
- **Input:** Dosen masukkan deskripsi tugas + kriteria penilaian (bisa dalam bahasa bebas).
- **Output:** Rubrik lengkap dengan level (Exemplary/Proficient/Developing/Beginning) per kriteria.
- **Format:** Bisa dikustomisasi dan diekspor ke tabel.

**D. Peer Review dengan AI Moderation**
- **Alur:** Student A submit → sistem assign peer reviewer (mahasiswa B) → AI moderasi review untuk memastikan kualitas feedback.
- **AI check:** Review terlalu pendek → minta detail. Review toxic → flag ke dosen. Review bagus → reward points.

**E. Question Bank Manager**
- **Fitur:** CRUD bank soal, tagging kategori/subkategori/Bloom level, random generator untuk ujian.
- **Filter:** Filter soal berdasarkan tingkat kesulitan, topik, tahun ajaran.
- **Sharing:** Guru bisa share bank soal ke guru lain dalam satu sekolah.

**F. Proctoring & Anti-Cheating Ringan**
- **Deteksi kejanggalan pola jawaban:** Analisis pattern jawaban antar siswa — jika dua siswa memiliki jawaban salah yang identik secara mencurigakan, sistem mengirim notifikasi ke pengawas.
- **Verifikasi identitas bertahap:** Bukan hanya di awal ujian, tetapi secara periodik selama ujian berlangsung (misal: foto wajah acak, prompt verifikasi).
- **Analisis metadata:** Cek metadata file submission (author name, computer name, edit history) untuk mendeteksi kecurangan.
- **Browser lockdown:** Mode ujian yang membatasi akses ke tab lain, screenshot, dan copy-paste (via JavaScript API + extension).
- **Flagging otomatis:** Jawaban yang butuh review manual (skor confidence rendah) otomatis ditandai untuk dicek dosen.

---

#### 4.2.2 Akademik & Penelitian

**A. Literature Review Assistant**
- **Cara kerja:** Upload PDF jurnal → AI extract: tujuan, metodologi, temuan, keterbatasan → generate summary per paper dan matrix perbandingan.
- **Output:** Draft literature review dalam format akademik dengan sitasi.
- **Batch processing:** Proses 10+ paper sekaligus → hasilkan tabel sintesis.

**B. Citation Generator**
- **Input:** DOI, URL, ISBN, atau manual entry.
- **Output:** Sitasi dalam format APA 7th, MLA, Chicago, IEEE, Vancouver, atau kustom.
- **Batch:** Import dari DOI list (CSV/RIS/BibTeX).

**C. Research Methodology Advisor**
- **Dialog interaktif:** Tanya jawab dengan AI tentang metodologi yang cocok.
- **Input:** Tipe penelitian (kuantitatif/kualitatif/mixed), bidang ilmu, tujuan.
- **Output:** Rekomendasi metodologi + justifikasi + contoh implementasi + referensi.

**D. Paper Structure Reviewer**
- **Input:** Draft paper (text atau docx).
- **Cek:** Struktur IMRaD (Introduction, Method, Result, Discussion), kelengkapan section, flow logis.
- **Output:** Saran perbaikan per section, checklist kelengkapan.

**E. Data Analysis Assistant**
- **Input:** Natural language query: "Apakah ada hubungan antara nilai UTS dan UAS?"
- **Output:** Rekomendasi uji statistik + syntax (SPSS/R/Python) + interpretasi hasil.
- **Proses:** Query → AI pilih uji statistik → generate script → user jalankan di lokal → user upload hasil → AI interpretasi.

**F. Structure & Outline Generator untuk Skripsi/Tesis/Disertasi**
- **Input:** Topik penelitian, bidang ilmu, jenis karya (skripsi/tesis/disertasi), referensi awal.
- **Output:** Outline lengkap per bab (BAB 1-5/6) dengan sub-bab, poin-poin yang harus dibahas, dan pertanyaan penelitian yang harus dijawab per sub-bab.
- **Template spesifik per jenis:** Skripsi S1 (BAB 1-5), Tesis S2 (BAB 1-6 + artikel), Disertasi S3 (BAB 1-6 + 2 artikel).
- **Integrasi dengan Literature Review Assistant:** Setiap sub-bab bisa langsung dikaitkan dengan jurnal yang sudah disummarize.
- **Export:** Word template (.docx) dengan formatting akademik siap pakai.

---

#### 4.2.3 Pembelajaran & Pengajaran

**A. Personalized Learning Path**
- **Cara kerja:** Analisis hasil ujian & tugas → mapping kompetensi yang sudah/ belum dikuasai → rekomendasi topik berikutnya.
- **Visualisasi:** Progress bar per kompetensi, color-coded (merah/kuning/hijau).
- **Remedial & Pengayaan:** Rekomendasi konten remedial untuk yang kurang, dan pengayaan untuk yang sudah mahir.

**B. Syllabus/RPS Generator**
- **Input:** Nama mata kuliah, CPMK (Capaian Pembelajaran Mata Kuliah), jumlah pertemuan, referensi.
- **Output:** RPS lengkap 16 pertemuan dengan: sub-CPMK, materi, metode pembelajaran, estimasi waktu, referensi per pertemuan.
- **Kustomisasi:** Bisa diedit setelah digenerate. Bisa diekspor ke PDF/DOCX.
- **Diferensiasi Pembelajaran:** AI menyarankan aktivitas pengayaan untuk siswa cepat dan aktivitas remedial untuk siswa lambat, dengan materi yang disesuaikan.
- **Align Kurikulum Nasional/Internasional:** Sistem bisa menyesuaikan output dengan standar Kurikulum Merdeka, IB (International Baccalaureate), Cambridge IGCSE/A-Level, atau akreditasi BAN-PT — guru tinggal pilih standar yang relevan.

**C. Meeting/Lecture Transcriber**
- **Input:** Rekaman audio/video (MP3, MP4, M4A, WEBM).
- **Proses:** ASR (Whisper lokal) → transcript → AI summarization → action items.
- **Output:** Transkrip + ringkasan eksekutif + poin penting + daftar tugas.

**D. Math Solver Step-by-Step**
- **Input:** Soal matematika (via teks, LaTeX, atau foto).
- **Proses:** OCR untuk foto → parsing soal → solve step-by-step.
- **Mode:** "Tunjukkan langkah" (belajar) vs "Hanya jawaban" (verifikasi).
- **Ruang lingkup:** Aljabar, kalkulus, trigonometri, statistika, matriks, diferensial.

**E. Code Tutor**
- **Fitur:** Debugging assistance, code review, explain code, generate code dari deskripsi.
- **Bahasa:** Python, JavaScript, Java, C++, Go, Rust, SQL, dll.
- **Integrasi:** Bisa dihubungkan ke GitHub repo untuk code review.
- **Execution:** Sandboxed code execution untuk testing.

**F. Language Tutor**
- **Grammar Check:** Koreksi tata bahasa dengan penjelasan.
- **Pronunciation:** Text-to-speech + analisis fonetik.
- **Conversation Practice:** AI sebagai lawan bicara dengan koreksi real-time.
- **Writing Assistant:** Bantu drafting esai bahasa asing.

**G. Virtual Lab Simulator**
- **Fisika:** Simulasi eksperimen (gerak, listrik, optik, termodinamika).
- **Kimia:** Simulasi reaksi kimia, titrasi, pembentukan senyawa.
- **Biologi:** Simulasi anatomi, ekosistem, genetika.
- **Teknik:** Simulasi rangkaian listrik, struktur bangunan.
- **Metode:** Interactive visualizations menggunakan Three.js atau embedded simulator.

---

#### 4.2.4 Manajemen & Kolaborasi

**A. Study Groups**
- **Chat room real-time** dengan AI facilitator yang membantu diskusi.
- **AI Facilitator fungsi:**
  - Menjawab pertanyaan yang belum terjawab oleh anggota.
  - Merangkum diskusi setiap 30 menit.
  - Mendeteksi miskonsepsi dan meluruskannya.
  - Memberikan quiz kilat di akhir sesi diskusi.
- **Output:** Ringkasan diskusi otomatis dikirim ke email anggota.

**B. Knowledge Gap Analyzer**
- **Input:** Nilai ujian, tugas, kuis per siswa.
- **Proses:** Analisis pattern kesalahan → identifikasi topik yang belum dikuasai.
- **Output per siswa:** "Kamu lemah di: [daftar topik]. Rekomendasi: [link materi]".
- **Output per kelas:** "Sebanyak 65% siswa kesulitan di topik [X]". → insight untuk dosen.

**C. Grade Analytics Dashboard**
- **Visualisasi:**
  - Distribusi nilai per ujian (histogram).
  - Tren progres per siswa sepanjang semester.
  - Perbandingan antar kelas/angkatan.
  - Analisis butir soal (tingkat kesulitan, daya beda).
- **Export:** Grafik bisa diekspor ke PDF untuk rapor akademik.

**D. AI Discussion Moderator**
- **Cara kerja:** Monitor forum diskusi → flag post yang mengandung:
  - Bahasa tidak sopan → sembunyikan + notifikasi moderator.
  - Spoiler jawaban → flag ke dosen.
  - Pertanyaan bagus → pin + reward points.
  - Off-topic → pindahkan ke forum umum.

**E. Assignment Scheduler**
- **AI Prioritization:** Input deadline semua tugas → jadwal pengerjaan optimal berdasarkan tingkat kesulitan dan tenggat.
- **Reminder:** Notifikasi progres (email/push) jika mendekati deadline.
- **Integration:** Sinkron dengan Google Calendar / Outlook.

**F. Career Path Recommender**
- **Input:** Nilai akademik, minat (survey), ekstrakurikuler, hasil psikotes.
- **Proses:** AI matching dengan basis data karir.
- **Output:**
  - Rekomendasi jurusan kuliah (untuk SMA).
  - Rekomendasi karir (untuk mahasiswa).
  - Gap analysis: skill yang perlu dipelajari.
  - Rencana pengembangan 1-5 tahun.

**G. Learning Analytics Dashboard — Analisis Sentimen & Prediksi Nilai**
- **Analisis sentimen interaksi siswa dengan AI:** Setiap chat siswa dengan Subject Agent dianalisis sentimennya (positif/netral/negatif/frustrasi). Dashboard untuk guru/dosen menampilkan siswa yang menunjukkan frustrasi atau kebingungan agar bisa segera diintervensi.
- **Prediksi nilai:** Berdasarkan performa tugas, kuis, dan ujian saat ini, AI memprediksi rentang nilai akhir siswa per mata kuliah. Jika prediksi menunjukkan risiko gagal, sistem mengirim notifikasi preventif ke dosen dan siswa.
- **Laporan otomatis:** Ringkasan mingguan/bulanan dikirim ke email pendidik dalam format PDF.

**H. Version Control untuk Dokumen Akademik**
- **Integrasi Git:** Setiap project folder memiliki version control berbasis Git ringan — history perubahan skripsi, makalah, coding project.
- **Diff visual:** Perbandingan antar versi dengan highlight perubahan (cocok untuk melihat progress bimbingan skripsi).
- **Checkpoint:** Mahasiswa bisa bikin checkpoint sebelum revisi besar, dan rollback kapan saja.
- **Kolaborasi:** Multi-author dengan merge tracking — siapa mengubah apa dan kapan.

---

### 4.3 Exam Correction dengan Identity Filter

**Alur lengkap:**

```
1. Dosen upload soal → Sistem simpan dengan identityFilter: true
2. Mahasiswa submit jawaban (teks/file)
3. Pre-filter: scan jawaban untuk deteksi identitas
   a. Deteksi NIM, nama, tanda tangan di body jawaban
   b. Deteksi metadata file (author name, computer name)
   c. Jika terdeteksi → redact + log + notifikasi ke dosen
4. Jawaban yang sudah bersih dikirim ke AI untuk grading
5. AI grade berdasarkan rubrik yang sudah ditentukan
6. Sistem re-map identitas ke nilai (hanya dosen yang bisa lihat mapping)
```

**Teknik deteksi identitas:**
- **NER model** (spaCy) untuk nama, NIM, email
- **Regex patterns** untuk format NIM/NISN khas sekolah
- **Image OCR** untuk tanda tangan di scan jawaban
- **EXIF/metadata** untuk data author file

---

### 4.4 Multilingual & Accessibility Support

**Dukungan Bahasa:**
- **Bahasa Indonesia & Inggris** sebagai default (semua konten antarmuka tersedia dalam dua bahasa).
- **Bahasa daerah:** Dukungan untuk Bahasa Jawa, Sunda, Minang, dan bahasa daerah lain via toggles di pengguna. AI akan merespons dalam bahasa yang dipilih (menggunakan model multilingual).
- **Terjemahan real-time:** Fitur "translate" di setiap chat — percakapan bisa diterjemahkan ke bahasa lain tanpa mengubah konteks.

**Accessibility:**
- **Text-to-Speech (TTS):** Semua konten teks bisa dibacakan dengan suara natural. Khusus untuk siswa SD dan siswa berkebutuhan khusus.
- **Speech-to-Text (STT):** Input suara untuk chat — siswa bisa bertanya dengan bicara, AI merespon dengan teks.
- **Mode baca mudah (Simplified Text):** Tombol "Sederhanakan" yang merubah teks kompleks menjadi kalimat pendek dan sederhana, ideal untuk siswa disleksia atau kesulitan membaca.
- **High Contrast Mode:** Tema kontras tinggi untuk siswa dengan gangguan penglihatan.
- **Screen reader friendly:** Semantic HTML + ARIA labels di seluruh komponen UI.
- **Font customization:** Opsi font ramah disleksia (OpenDyslexic) dan ukuran font bisa diubah.

**Implementasi teknis:**
- TTS/STT menggunakan Web Speech API + model lokal Whisper untuk offline.
- Simplified text menggunakan model summarization lokal (T5-small) untuk privasi.
- Bahasa daerah menggunakan model NLLB (No Language Left Behind) dari Meta.

### 4.5 Gamification & Engagement Features

**Tujuan:** Meningkatkan motivasi belajar siswa SD-SMA melalui elemen permainan.

**Komponen:**
- **Badges & Achievements:** Lencana yang diberikan saat siswa mencapai milestone tertentu (misal: "Math Whiz" setelah menyelesaikan 50 soal matematika, "Streak Master" setelah 7 hari berturut-turut belajar).
- **Experience Points (XP):** Setiap aktivitas belajar (chat, kuis, tugas) memberi XP. Level naik setiap 1000 XP — semakin tinggi level, semakin banyak fitur yang terbuka.
- **Leaderboard per Kelas:** Peringkat anonim (menggunakan nickname) berdasarkan XP mingguan. Hanya menampilkan top 10 untuk menghindari demotivasi.
- **Learning Streaks:** Hitungan hari berturut-turut belajar. Streak >7 hari mendapat bonus XP.
- **Daily Challenges:** Tantangan harian ("Jawab 5 soal fisika dengan benar", "Baca 1 ringkasan jurnal") — selesai → dapat badge harian.
- **Mode Kompetitif:** Antar kelompok belajar dalam satu kelas — tim dengan XP tertinggi di akhir bulan mendapat sertifikat digital.
- **Unlockable Content:** Pada level tertentu, siswa bisa unlock avatar, tema, atau akses ke quiz eksklusif.

**Etika & Keamanan:**
- Leaderboard bersifat anonim (nickname, tanpa nama asli).
- Tidak ada mekanisme pay-to-win — semua item hanya bisa didapat melalui aktivitas belajar.
- Sistem anti-spam: XP dibatasi per hari untuk mencegah grinding berlebihan.

### 4.6 Career & University Preparation (Khusus SMA/Mahasiswa)

**Fitur tambahan (melengkapi Career Path Recommender di 4.2.4.F):**

**A. University Match Recommender**
- **Input:** Nilai akademik (rapor/IPK), minat jurusan, preferensi lokasi, budget, hasil tes bakat.
- **Proses:** AI matching dengan database universitas dalam negeri & luar negeri (termasuk program beasiswa).
- **Output:**
  - Daftar universitas yang cocok dengan probabilitas diterima.
  - Syarat masuk per universitas (nilai minimum, portofolio, tes).
  - Timeline persiapan (kapan harus daftar, tes, wawancara).
- **Integrasi:** Terhubung dengan database LTMPT/SBMPTN, portal beasiswa LPDP, dan universitas mitra.

**B. Portfolio Builder**
- **Tujuan:** Membantu mahasiswa membangun portofolio akademik dan profesional.
- **Fitur:**
  - Template portofolio (web, PDF) berdasarkan bidang (desain, programming, riset, bisnis).
  - Integrasi dengan Project Folder — setiap project selesai otomatis bisa ditambahkan ke portofolio.
  - AI review: "Apakah portofolio ini cukup untuk melamar kerja di bidang X?"
  - Export ke PDF atau deploy ke GitHub Pages / Vercel.

**C. Interview Preparation**
- **Simulasi wawancara dengan AI:** AI berperan sebagai pewawancara (kerja, beasiswa, S2).
- **Mode:**
  - **Practice:** Pertanyaan standar, tanpa tekanan waktu, AI memberi feedback setelah setiap jawaban.
  - **Mock Interview:** Waktu terbatas, AI menilai bahasa tubuh (via video) dan konten jawaban.
  - **Behavioral:** Simulasi pertanyaan behavioral (STAR method) dengan scoring.
- **Feedback:** Tone analysis (percaya diri/gugup), content completeness, struktur jawaban.

### 4.7 Offline & Mobile-First Mode

**Tujuan:** Menjamin akses belajar tetap tersedia meskipun tanpa koneksi internet (khususnya untuk daerah dengan infrastruktur terbatas).

**Fitur:**
- **Progressive Web App (PWA):** Aplikasi bisa diinstal ke home screen smartphone seperti apps native. Mendukung push notification untuk pengingat tugas dan jadwal.
- **Sinkronisasi offline:**
  - Materi belajar dan chat history di-cache di localStorage/IndexedDB saat online.
  - Chat dengan AI offline menggunakan model lokal yang diunduh (via Ollama/ONNX) — mode terbatas (tanpa RAG, tanpa web search).
  - Saat online kembali, data sinkronisasi otomatis ke server.
- **Service Worker:** Menangani caching strategi (stale-while-revalidate untuk konten statis, network-first untuk chat).
- **Push Notification:** Pengingat deadline tugas, streak reminder, notifikasi nilai.
- **Bandwidth saving mode:** Mode hemat data yang mengompresi gambar dan mengurangi kualitas suara.
- **Cross-platform:** Responsive di semua ukuran layar (mobile, tablet, desktop).

**Keterbatasan offline:**
- Tanpa akses Subject Agent (RAG membutuhkan server).
- Hanya model lokal yang bisa digunakan (tanpa GPT/Claude/Gemini cloud).
- Fitur kolaborasi real-time tidak tersedia (digantikan dengan queue sinkronisasi).

---

## 5. Model AI Selection & Policy Filter

### 5.1 Arsitektur Model Selection

```
User Request
    │
    ▼
┌─────────────────────────────────────┐
│ 1. Role & Subject Identification    │
│    - "Saya mahasiswa S1 Informatika"│
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 2. Policy Evaluation (OPA)          │
│    - Cek role allowed_models        │
│    - Cek subject allowed_models     │
│    - Cek grade_level restrictions   │
│    - Cek data residency rules       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 3. Available Models Filtered        │
│    - Model aktif (isActive: true)   │
│    - Sesuai policy                  │
│    - Sesuai budget/cost             │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 4. User Selects Model               │
│    - Dropdown di UI (filtered list) │
│    - Auto-select jika preferred     │
│    - Subject default jika ada       │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│ 5. Cost Router                      │
│    - Simple query → model murah     │
│    - Complex task → model mahal     │
│    - Batas budget per bulan         │
└──────────────┬──────────────────────┘
               ▼
          Send to AI
```

### 5.2 Policy Engine (OPA - Rego)

Contoh kebijakan dalam Rego language:

```rego
# model_selection.rego
package model_selection

# Default: deny all models
default allow = false

# Admin: allow all models
allow {
    input.user.role == "ADMIN"
}

# Students SD-SMP: only basic models, no web search
allow {
    input.user.role in ["SD", "SMP"]
    model := data.models[input.model_id]
    model.provider in ["ANTHROPIC", "GOOGLE"]
    not "WEB_SEARCH" in model.capabilities
    model.max_tokens <= 8192
}

# University students: allow advanced models
allow {
    input.user.role in ["S1", "S2", "S3"]
    model := data.models[input.model_id]
    model.is_active == true
    input.user.role in model.allowed_roles
}

# Lecturers: allow all with higher token limit
allow {
    input.user.role in ["LECTURER", "TEACHER"]
    model := data.models[input.model_id]
    model.is_active == true
}

# Deny if subject restriction exists
deny["Model not allowed for this subject"] {
    model := data.models[input.model_id]
    input.subject in model.allowed_subjects
}
```

### 5.3 Contoh Skenario

| Role | Ingin Pakai | Hasil |
|---|---|---|
| Siswa SD | ChatGPT-4o image gen | **Diblokir** → hanya model basic tanpa image gen |
| Siswa SD | Gemini 2.0 Flash | **Diizinkan** |
| Mahasiswa S1 | Claude 3.5 Sonnet | **Diizinkan** |
| Mahasiswa S1 | GPT-4o (cost tinggi) | **Diizinkan** jika ada budget, atau **diarahkan** ke model alternatif |
| Dosen | Claude Opus + web search | **Diizinkan** penuh |
| Mahasiswa S2 data sensitif | Model eksternal | **Diarahkan** ke model lokal (Ollama) via data_residency policy |

### 5.4 Cost Router Logic

```python
async def route_by_cost(user: User, prompt: str, subject: Subject) -> str:
    """
    Route query ke model berdasarkan kompleksitas dan budget.
    """
    prompt_length = len(prompt)
    has_code = detect_code_in_prompt(prompt)
    has_math = detect_math_in_prompt(prompt)
    has_image = detect_image_in_prompt(prompt)
    
    # Simple questions → cheap model
    if prompt_length < 100 and not has_code and not has_math:
        return "gemini-2.0-flash"  # Cheap & fast
    
    # Code questions → Claude (best at code)
    if has_code:
        return "claude-3.5-sonnet"
    
    # Math questions → Gemini Pro (best at math)
    if has_math:
        return "gemini-2.0-pro"
    
    # Complex/difficult → GPT-4o
    if prompt_length > 1000:
        return "gpt-4o"
    
    # Default per user preference
    return user.preferred_model_id or "gpt-4o-mini"
```

---

## 6. Filter Pipeline Detail

### 6.1 Arsitektur Pipeline

```
Input (raw text)
    │
    ├── 1. PII Masking ─────────────────── Redact nama, NIM, email, telepon, alamat
    │    │                                   Teknik: spaCy NER + Presidio + Regex
    │    │                                   Output: filtered_text + pii_log[]
    │
    ├── 2. Prompt Injection Detection ───── Cek jailbreak, prompt leak, role-play bypass
    │    │                                   Teknik: ONNX classifier + heuristic rules
    │    │                                   Action: BLOCK jika skor > threshold
    │
    ├── 3. Academic Integrity Gate ──────── Cek cheating intent
    │    │                                   Teknik: Sentence embedding + cosine similarity
    │    │                                   Action: REDIRECT ke tutor mode atau BLOCK
    │
    ├── 4. Content Policy (OPA) ────────── Evaluasi kebijakan konten
    │    │                                   Teknik: OPA Rego rules
    │    │                                   Action: BLOCK/FLAG sesuai policy
    │
    ├── 5. Profanity Filter ────────────── Filter kata kasar & hate speech
    │    │                                   Teknik: Hybrid (list + classifier ONNX)
    │    │                                   Action: REDACT atau BLOCK
    │
    ├── 6. Topic Guardrail ─────────────── Cek relevansi pendidikan
    │    │                                   Teknik: Zero-shot classifier
    │    │                                   Action: FLAG jika off-topic
    │
    ├── 7. Cost Router ─────────────────── Tentukan model optimal
    │    │                                   Teknik: Heuristic + ML classifier
    │    │                                   Output: model_id
    │
    ├── 8. Context Optimizer ───────────── Prune chat history
    │    │                                   Teknik: Sliding window + summarization
    │    │                                   Output: optimized_messages[]
    │
    ├── 9. Data Residency Check ────────── Cek data restriction
    │    │                                   Teknik: Policy matching (OPA)
    │    │                                   Action: REDIRECT ke local model jika perlu
    │
    └── 10. Rate Limiter ───────────────── Cek quota
                                         Teknik: Redis token bucket
                                         Action: THROTTLE jika melebihi limit
                                                │
                                                ▼
                                    Send to AI Model
                                                │
                                                ▼
    ┌── A. Response Sanitizer ─────────── Hapus hallucinated PII, link mencurigakan
    │                                      Teknik: Regex + NER
    │
    ├── B. Toxicity Re-check ──────────── Pastikan response aman
    │                                      Teknik: Sama seperti filter #5
    │                                      Action: REGENERATE jika toxic
    │
    └── C. Brand Inject ───────────────── Inject watermark/disclaimer
                                         Teknik: Template injection
                                                │
                                                ▼
                                         Return to User
```

### 6.2 Implementasi Pipeline (Python)

```python
# app/filters/pipeline.py

from typing import List
from .base import BaseFilter, FilterResult
from .pre_filter import (
    PiiMaskingFilter,
    PromptInjectionFilter,
    AcademicIntegrityFilter,
    ContentPolicyFilter,
    ProfanityFilter,
    TopicGuardrailFilter,
    CostRouterFilter,
    ContextOptimizerFilter,
    DataResidencyFilter,
    RateLimiterFilter,
)
from .post_filter import (
    ResponseSanitizerFilter,
    ToxicityCheckFilter,
    BrandInjectFilter,
)


class FilterPipeline:
    """
    Orchestrates the entire filter pipeline.
    Pre-filter runs on user input before sending to AI.
    Post-filter runs on AI response before returning to user.
    """
    
    def __init__(self):
        self.pre_filters: List[BaseFilter] = [
            PiiMaskingFilter(),
            PromptInjectionFilter(),
            AcademicIntegrityFilter(),
            ContentPolicyFilter(),
            ProfanityFilter(),
            TopicGuardrailFilter(),
            CostRouterFilter(),
            ContextOptimizerFilter(),
            DataResidencyFilter(),
            RateLimiterFilter(),
        ]
        self.post_filters: List[BaseFilter] = [
            ResponseSanitizerFilter(),
            ToxicityCheckFilter(),
            BrandInjectFilter(),
        ]
    
    async def run_pre_filter(
        self,
        text: str,
        user: dict,
        context: dict,
    ) -> FilterResult:
        """
        Run all pre-filters sequentially.
        If any filter returns BLOCK, the pipeline stops.
        """
        result = FilterResult(
            text=text,
            is_blocked=False,
            actions=[],
            metadata={},
        )
        
        for filter_obj in self.pre_filters:
            result = await filter_obj.process(result, user, context)
            
            if result.is_blocked:
                logger.warning(
                    f"Pre-filter blocked by {filter_obj.__class__.__name__}: "
                    f"{result.block_reason}"
                )
                break
        
        return result
    
    async def run_post_filter(
        self,
        text: str,
        user: dict,
        context: dict,
    ) -> FilterResult:
        """
        Run all post-filters on AI response.
        """
        result = FilterResult(
            text=text,
            is_blocked=False,
            actions=[],
            metadata={},
        )
        
        for filter_obj in self.post_filters:
            result = await filter_obj.process(result, user, context)
        
        return result
```

### 6.3 Detail Setiap Filter

#### Filter 1: PII Masking

```python
# app/filters/pre_filter/pii.py

import re
import spacy
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from ..base import BaseFilter, FilterResult


class PiiMaskingFilter(BaseFilter):
    """
    Mendeteksi dan meredact informasi pribadi sebelum dikirim ke AI.
    Menggunakan spaCy NER + Presidio untuk deteksi nama, NIM, email, telepon.
    """
    
    def __init__(self):
        self.nlp = spacy.load("id_core_news_sm")  # Indonesian NER model
        self.analyzer = AnalyzerEngine()
        self.anonymizer = AnonymizerEngine()
        
        # Regex patterns for NIM/NISN (kustom per sekolah)
        self.nim_pattern = re.compile(r'\b\d{8,12}\b')  # 8-12 digit NIM/NISN
        self.email_pattern = re.compile(r'\b[\w.%-]+@[\w.-]+\.[A-Za-z]{2,}\b')
        self.phone_pattern = re.compile(r'(\+62|62|0)8[1-9][0-9]{6,11}')
        
        # Custom regex entities
        self.custom_patterns = {
            "NIM": self.nim_pattern,
            "EMAIL": self.email_pattern,
            "PHONE": self.phone_pattern,
        }
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        text = result.text
        pii_found = []
        
        # 1. spaCy NER untuk nama orang, lokasi, organisasi
        doc = self.nlp(text)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "GPE", "ORG"]:
                pii_found.append({
                    "type": ent.label_,
                    "value": ent.text,
                    "start": ent.start_char,
                    "end": ent.end_char,
                })
        
        # 2. Presidio analyzer
        presidio_results = self.analyzer.analyze(
            text=text,
            entities=["PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS", 
                      "CREDIT_CARD", "LOCATION"],
            language="id",
        )
        for pii_ent in presidio_results:
            pii_found.append({
                "type": pii_ent.entity_type,
                "value": text[pii_ent.start:pii_ent.end],
                "start": pii_ent.start,
                "end": pii_ent.end,
                "score": pii_ent.score,
            })
        
        # 3. Regex for NIM, email, phone
        for entity_type, pattern in self.custom_patterns.items():
            for match in pattern.finditer(text):
                pii_found.append({
                    "type": entity_type,
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end(),
                })
        
        # Anonymize
        anonymized_text = self.anonymizer.anonymize(
            text=text,
            analyzer_results=presidio_results,
        ).text
        
        # Also replace regex matches
        for pii in pii_found:
            if pii["type"] in ["NIM", "EMAIL", "PHONE"]:
                placeholder = f"[REDACTED_{pii['type']}]"
                anonymized_text = anonymized_text.replace(
                    pii["value"], placeholder, 1
                )
        
        result.text = anonymized_text
        result.actions.append("pii_masked")
        result.metadata["pii_found"] = pii_found
        result.metadata["pii_count"] = len(pii_found)
        
        return result
```

#### Filter 2: Prompt Injection Detection

```python
# app/filters/pre_filter/prompt_injection.py

import onnxruntime as ort
import numpy as np
from transformers import AutoTokenizer
from ..base import BaseFilter, FilterResult


class PromptInjectionFilter(BaseFilter):
    """
    Mendeteksi prompt injection, jailbreak, prompt leak.
    Menggunakan model ONNX yang sudah di-export dari transformers.
    """
    
    def __init__(self):
        # Load ONNX model (dilatih dengan dataset prompt injection)
        self.session = ort.InferenceSession(
            "models/prompt_injection/model.onnx"
        )
        self.tokenizer = AutoTokenizer.from_pretrained(
            "models/prompt_injection/tokenizer"
        )
        
        # Heuristic rules (sebagai lapisan kedua)
        self.injection_patterns = [
            r"ignore\s+(all\s+)?(previous|above)\s+instructions",
            r"you\s+are\s+(now|free|unleashed)",
            r"jailbreak|jail\s*break",
            r"DAN|do\s+anything\s+now",
            r"system\s+prompt",
            r"bypass\s+(the\s+)?(filter|restriction|rule)",
            r"pretend\s+(to\s+)?be",
            r"act\s+as\s+if",
            r"you\s+dont\s+(have|need)\s+(any|the)\s+(rules|restrictions)",
            r"output\s+your\s+(system\s+)?prompt",
            r"reveal\s+(your\s+)?(instructions|prompt|guidelines)",
        ]
        self.compiled_patterns = [
            re.compile(p, re.IGNORECASE) for p in self.injection_patterns
        ]
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        text = result.text
        
        # 1. ML-based detection
        inputs = self.tokenizer(text, return_tensors="np", truncation=True, max_length=512)
        outputs = self.session.run(None, {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"],
        })
        injection_score = float(outputs[0][0][1])  # Probability of injection
        
        # 2. Heuristic detection
        heuristic_score = 0.0
        matched_patterns = []
        for i, pattern in enumerate(self.compiled_patterns):
            if pattern.search(text):
                heuristic_score += 0.3
                matched_patterns.append(self.injection_patterns[i])
        
        # Combine scores
        final_score = max(injection_score, heuristic_score)
        
        result.metadata["prompt_injection_score"] = final_score
        result.metadata["injection_patterns"] = matched_patterns
        
        if final_score > 0.8:
            result.is_blocked = True
            result.block_reason = "Prompt injection detected"
            result.actions.append("blocked_injection")
        elif final_score > 0.5:
            result.actions.append("flagged_injection")
            # Flag but still allow (human review needed)
        
        return result
```

#### Filter 3: Academic Integrity Gate

```python
# app/filters/pre_filter/academic_integrity.py

from sentence_transformers import SentenceTransformer
import numpy as np
from ..base import BaseFilter, FilterResult


class AcademicIntegrityFilter(BaseFilter):
    """
    Mendeteksi intent kecurangan akademik.
    Query mencurigakan akan di-redirect ke tutor mode.
    """
    
    def __init__(self):
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Cheating patterns (embedded vectors)
        self.cheating_patterns = [
            "buatkan esai untuk saya",
            "kerjakan PR saya",
            "tuliskan jawaban ujian",
            "buatkan coding assignment saya",
            "generate kode program untuk tugas",
            "saya tidak mau belajar, kerjakan saja",
            "buatkan makalah tentang",
            "tolong selesaikan soal ujian ini",
            "write my essay",
            "do my homework",
            "complete my assignment",
            "solve my exam",
            "write my paper",
        ]
        self.cheating_vectors = self.encoder.encode(self.cheating_patterns)
        
        # Tutor mode keywords (boleh)
        self.tutor_keywords = [
            "jelaskan", "ajarkan", "bantu saya memahami",
            "beri contoh", "tutor saya", "bagaimana cara",
            "explain", "teach me", "help me understand",
            "give example", "what is", "how does",
        ]
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        text = result.text.lower()
        
        # 1. Check for tutor keywords first
        has_tutor_intent = any(
            kw in text for kw in self.tutor_keywords
        )
        
        # 2. Cosine similarity with cheating patterns
        query_vector = self.encoder.encode([text])
        similarities = np.dot(self.cheating_vectors, query_vector.T).flatten()
        max_similarity = float(np.max(similarities))
        
        result.metadata["cheating_similarity"] = max_similarity
        
        # Jika ada tutor keyword dan similarity rendah → allow
        if has_tutor_intent and max_similarity < 0.6:
            result.actions.append("academic_ok_tutor_mode")
            return result
        
        # Jika similarity tinggi dan TIDAK ada tutor intent → cheating
        if max_similarity > 0.75 and not has_tutor_intent:
            # Redirect to tutor mode instead of blocking
            result.is_blocked = True
            result.block_reason = "CHEATING_DETECTED"
            result.block_suggestion = (
                "Sepertinya Anda ingin meminta AI untuk mengerjakan tugas. "
                "Saya akan membantu Anda MEMAHAMI materinya, bukan mengerjakannya. "
                "Silakan tanyakan konsep yang ingin Anda pelajari."
            )
            result.actions.append("redirected_to_tutor")
            result.metadata["cheating_pattern"] = self.cheating_patterns[
                int(np.argmax(similarities))
            ]
        
        return result
```

#### Filter 4: Content Policy (OPA)

```python
# app/filters/pre_filter/content_policy.py

import httpx
import json
from ..base import BaseFilter, FilterResult


class ContentPolicyFilter(BaseFilter):
    """
    Evaluasi konten terhadap kebijakan sekolah menggunakan OPA.
    OPA dijalankan sebagai sidecar container.
    """
    
    def __init__(self, opa_url: str = "http://localhost:8181"):
        self.opa_url = opa_url
        self.client = httpx.AsyncClient(timeout=5.0)
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        text = result.text
        
        # Prepare input for OPA
        opa_input = {
            "input": {
                "text": text,
                "user": {
                    "role": user.get("role"),
                    "grade_level": user.get("grade_level"),
                    "school_id": user.get("school_id"),
                },
                "context": {
                    "subject": context.get("subject"),
                    "is_exam": context.get("is_exam", False),
                },
            }
        }
        
        # Evaluate against OPA
        try:
            response = await self.client.post(
                f"{self.opa_url}/v1/data/content_filter/allow",
                json=opa_input,
            )
            result_data = response.json()
            
            if not result_data.get("result", True):
                # Get denial reason
                denial_response = await self.client.post(
                    f"{self.opa_url}/v1/data/content_filter/deny",
                    json=opa_input,
                )
                denial_data = denial_response.json()
                
                result.is_blocked = True
                result.block_reason = denial_data.get("result", ["Content policy violation"])[0]
                result.actions.append("blocked_by_policy")
                
        except httpx.RequestError:
            # If OPA is down, fail open (log warning)
            logger.warning("OPA service unreachable, allowing request")
            result.actions.append("opa_unreachable_bypass")
        
        return result
```

#### Filter 7: Cost Router

```python
# app/filters/pre_filter/cost_router.py

import tiktoken
from ..base import BaseFilter, FilterResult


class CostRouterFilter(BaseFilter):
    """
    Mengarahkan query ke model optimal berdasarkan:
    - Kompleksitas prompt (panjang, ada code/math)
    - Budget user/school per bulan
    - Latency requirements
    """
    
    def __init__(self):
        self.enc = tiktoken.get_encoding("cl100k_base")
        
        # Model tier definitions
        self.model_tiers = {
            "cheap": {
                "models": ["gemini-2.0-flash", "gpt-4o-mini"],
                "max_cost_per_1k": 0.00015,
            },
            "medium": {
                "models": ["gpt-4o", "claude-3.5-sonnet"],
                "max_cost_per_1k": 0.003,
            },
            "expensive": {
                "models": ["claude-3-opus", "gpt-4-turbo"],
                "max_cost_per_1k": 0.015,
            },
        }
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        text = result.text
        token_count = len(self.enc.encode(text))
        
        # Complexity analysis
        has_code = bool(re.search(r'```[\s\S]*?```|`[^`]+`', text))
        has_math = bool(re.search(r'\\\(|\\\[|\$.*\$', text))
        has_image = context.get("has_image", False)
        is_long = token_count > 500
        
        # Budget check
        monthly_budget = user.get("monthly_budget", 10.0)  # USD
        current_spend = user.get("monthly_spend", 0.0)
        remaining_budget = monthly_budget - current_spend
        
        suggested_model = None
        
        if has_image or is_long and has_math:
            suggested_model = random.choice(self.model_tiers["medium"]["models"])
        elif has_code:
            suggested_model = "claude-3.5-sonnet"  # Best at code
        elif has_math:
            suggested_model = "gemini-2.0-pro"  # Best at math
        elif token_count < 100:
            suggested_model = random.choice(self.model_tiers["cheap"]["models"])
        else:
            suggested_model = "gpt-4o-mini"
        
        # Override if budget is low
        if remaining_budget < 2.0:
            suggested_model = random.choice(self.model_tiers["cheap"]["models"])
        
        result.metadata["suggested_model"] = suggested_model
        result.metadata["token_count"] = token_count
        result.metadata["estimated_cost"] = self._estimate_cost(
            suggested_model, token_count
        )
        result.actions.append(f"cost_routed_to_{suggested_model}")
        
        return result
```

#### Filter 8: Context Optimizer

```python
# app/filters/pre_filter/context_optimizer.py

from ..base import BaseFilter, FilterResult


class ContextOptimizerFilter(BaseFilter):
    """
    Mengoptimalkan chat history agar tidak melebihi context window.
    Strategi:
    - Sliding window: buang pesan tertua
    - Summarization: ringkas pesan lama
    - Priority: pesan sistem > pesan terbaru > pesan lama
    """
    
    MAX_CONTEXT_TOKENS = 128000  # Default, bisa dikustom per model
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        messages = context.get("chat_history", [])
        model_max_tokens = context.get("max_tokens", self.MAX_CONTEXT_TOKENS)
        
        if not messages:
            return result
        
        # Calculate token count per message
        total_tokens = sum(
            len(msg.get("content", "").split()) * 1.3  # Rough estimate
            for msg in messages
        )
        
        if total_tokens <= model_max_tokens * 0.8:
            return result  # No optimization needed
        
        # Optimization needed
        # Strategy 1: Keep system message + last N messages
        system_messages = [m for m in messages if m["role"] == "system"]
        non_system = [m for m in messages if m["role"] != "system"]
        
        # Keep system messages + last messages that fit
        optimized = list(system_messages)
        
        # If still too big, summarize old messages
        if len(system_messages) > 0:
            old_messages = non_system[:-10]  # All except last 10
            recent_messages = non_system[-10:]
            
            if old_messages:
                summary = self._summarize_messages(old_messages)
                optimized.append({
                    "role": "system",
                    "content": f"[Ringkasan percakapan sebelumnya]: {summary}",
                })
                optimized.extend(recent_messages)
            else:
                optimized.extend(non_system)
        else:
            optimized = non_system[-20:]  # Keep last 20 if no system message
        
        result.metadata["context_optimized"] = True
        result.metadata["original_message_count"] = len(messages)
        result.metadata["optimized_message_count"] = len(optimized)
        context["chat_history"] = optimized
        
        return result
    
    def _summarize_messages(self, messages: list) -> str:
        """Simple summarization by concatenating key points."""
        # In production, use a fast local model for summarization
        content = " ".join(m["content"][:200] for m in messages if m["content"])
        return content[:500] + "..." if len(content) > 500 else content
```

#### Filter 10: Rate Limiter

```python
# app/filters/pre_filter/rate_limiter.py

import redis.asyncio as redis
from ..base import BaseFilter, FilterResult


class RateLimiterFilter(BaseFilter):
    """
    Rate limiting per user, per model, per school.
    Menggunakan Redis dengan algoritma Token Bucket.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
    
    async def process(
        self,
        result: FilterResult,
        user: dict,
        context: dict,
    ) -> FilterResult:
        user_id = user["id"]
        school_id = user["school_id"]
        model_id = result.metadata.get("suggested_model", "default")
        
        # Check multiple rate limits
        limits = [
            ("user", user_id, 60, 60),        # 60 requests per minute per user
            ("model", f"{user_id}:{model_id}", 30, 60),  # 30 per model per minute
            ("school", school_id, 1000, 60),   # 1000 per school per minute
        ]
        
        for limit_type, key, max_requests, window in limits:
            allowed = await self._check_rate_limit(
                f"ratelimit:{limit_type}:{key}",
                max_requests,
                window,
            )
            
            if not allowed:
                result.is_blocked = True
                result.block_reason = f"Rate limit exceeded ({limit_type})"
                result.actions.append(f"rate_limited_{limit_type}")
                
                # Add retry-after header info
                result.metadata["retry_after"] = window
                break
        
        return result
    
    async def _check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window: int,
    ) -> bool:
        """Token bucket rate limit check."""
        current = await self.redis.get(key)
        
        if current is None:
            await self.redis.setex(key, window, 1)
            return True
        
        current_count = int(current)
        if current_count >= max_requests:
            return False
        
        await self.redis.incr(key)
        return True
```

---

### 6.4 Filter Governance — Pendekatan Tambahan dari idea.md

#### 6.4.1 Dual-LLM Security Architecture

Menggunakan dua model secara berurutan sebagai lapisan keamanan tambahan di atas filter deterministic:

```
User Input → LLM-1 (Security Filter) → Jika lolos → LLM-2 (Response Generator) → User
```

| Komponen | Fungsi | Model |
|---|---|---|
| **LLM-1 — Security Filter** | Analisis query incoming untuk ancaman: prompt injection, toxic content, cheating intent. Output: classification + risk score | Model kecil & cepat (Gemini Flash / GPT-4o-mini) |
| **LLM-2 — Response Generator** | Menghasilkan respons edukasional, hanya dipanggil setelah LLM-1 memberikan klasifikasi "safe" | Model besar (GPT-4o / Claude Sonnet / Gemini Pro) |

**Keuntungan:**
- Memisahkan content moderation dari response generation — tidak ada konflik kepentingan.
- LLM-1 bisa menggunakan system prompt yang sangat ketat (tanpa peduli kualitas edukasi).
- Jika LLM-1 mendeteksi ancaman, LLM-2 tidak pernah melihat input tersebut (isolasi total).
- Cost efficiency: LLM-1 jauh lebih murah daripada LLM-2.

**Keterbatasan:**
- Latensi bertambah (2x LLM call).
- LLM-1 bisa kena false positive — perlu tuning threshold yang hati-hati.

#### 6.4.2 Klasifikasi Kontekstual 4 Level

Mengganti pendekatan binary block/allow dengan klasifikasi 4 tingkat:

| Level | Label | Tindakan | Contoh |
|---|---|---|---|
| **1** | **Safe** | Izinkan sepenuhnya | Pertanyaan matematika, help with homework concept |
| **2** | **Content Guidance** | Izinkan dengan warning/parental guidance | Topik sensitif (sejarah kelam, biologi reproduksi) — 14 sub-kategori |
| **3** | **Highly Sensitive** | Blokir, notifikasi pendidik, butuh approval manual | Konten dewasa, kekerasan grafis, politik identitas |
| **4** | **Toxic** | Blokir sepenuhnya, log + audit | Hate speech, instruksi kekerasan, self-harm, pornografi |

**Sub-kategori Content Guidance (14):**
1. Aktivitas praktik berisiko (lab kimia, olahraga)
2. Konten RSHE (Relationship, Sex, Health Education)
3. Kekerasan kontekstual (sejarah perang, biologi predator)
4. Konten keagamaan komparatif
5. Isu politik/kenegaraan
6. Kesehatan mental & konseling
7. Narkoba & alkohol (edukasi, bukan promosi)
8. Konten LSBTQ+
9. Kemiskinan & ketidaksetaraan
10. Bencana alam & tragedi
11. Mitos & takhayul
12. Konten bersumber dari AI (hallucination warning)
13. Informasi medis (disclaimer diperlukan)
14. Topik dewasa dalam literatur (novel, film)

**Implementasi:**
```python
# app/filters/pre_filter/content_classifier.py

class ContentClassifier:
    def classify(self, text: str, user_role: str) -> ClassificationResult:
        """
        Mengklasifikasikan konten ke dalam 4 level keamanan.
        Menggunakan zero-shot classifier lokal + fallback ke LLM-1.
        """
        # 1. Zero-shot classification dengan model lokal (BART-large)
        labels = ["safe", "content_guidance", "highly_sensitive", "toxic"]
        scores = self.zero_shot_classifier(text, labels)
        
        # 2. Jika skor toxic > threshold → langsung block
        if scores["toxic"] > 0.85:
            return ClassificationResult(level=4, action="BLOCK")
        
        # 3. Jika skor content_guidance tinggi → cek sub-kategori
        if scores["content_guidance"] > 0.6:
            subcategory = self.detect_subcategory(text)
            return ClassificationResult(level=2, action="WARN", subcategory=subcategory)
        
        # 4. Safe → allow
        return ClassificationResult(level=1, action="ALLOW")
```

#### 6.4.3 Human-in-the-Loop (HITL) untuk Kasus Ambigu

Untuk konten dengan skor keyakinan rendah dari filter otomatis:

**Alur HITL:**
```
Filter otomatis → Confidence < threshold → Tahan pesan → Notifikasi pendidik
                                                          ↓
                                              Pendidik review via dashboard
                                                          ↓
                                              Approve / Reject / Modify
                                                          ↓
                                              Pesan diteruskan / diblokir / diedit
```

**Kriteria HITL dipicu:**
- **Confidence ambiguity:** Filter memberikan skor antara 0.4-0.7 (tidak cukup yakin untuk block, tidak cukup yakin untuk allow).
- **Role mismatch:** Konten terdeteksi sebagai "Content Guidance" untuk murid SD (butuh persetujuan guru).
- **First-time trigger:** Topik baru yang belum pernah diklasifikasikan sebelumnya — butuh validasi manual sekali, setelah itu otomatis.
- **User escalation:** Siswa/guru bisa melaporkan false positive/negative — laporan masuk ke queue review.

**Dashboard HITL:**
```json
// Contoh item di queue review pendidik
{
  "pending_reviews": [
    {
      "id": "msg_abc123",
      "user": "Siswa SD Kelas 5 (anonim)",
      "timestamp": "2026-06-29T10:30:00Z",
      "original_text": "[Teks yang difilter]",
      "filter_results": {
        "pii_score": 0.1,
        "injection_score": 0.3,
        "toxicity_score": 0.6,  // Boundary
        "classification": "content_guidance",
        "confidence": 0.55       // Low confidence
      },
      "options": [
        "Allow — konten aman",
        "Block — konten tidak pantas",
        "Modify — sunting sebelum dikirim",
        "Escalate — ke admin sekolah"
      ]
    }
  ]
}
```

**Kebijakan:**
- HITL hanya untuk kasus ambiguous — tidak memperlambat 95% traffic normal.
- Setiap keputusan manual menjadi feedback untuk model filter (active learning loop).
- Timeout: jika pendidik tidak merespon dalam 24 jam, pesan diblokir secara default (fail secure).

---

## 7. Keamanan & Compliance

### 7.1 Data Flow Security

```
                    ┌─────────────────────────┐
                    │     User Data Flow       │
                    └─────────────────────────┘
                    
User Input
    │
    ▼
┌─────────────────────┐
│  HTTPS (TLS 1.3)    │  Encrypted in transit
└─────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│  AI Gateway (Internal Network)       │
│  - All PII filtered BEFORE leaving   │
│  - Logs: anonymized, no raw PII      │
│  - Encryption at rest (AES-256)      │
└──────────────────────────────────────┘
    │
    ├──► External AI API
    │    • Hanya teks yang sudah difilter
    │    • Tanpa identitas pengguna
    │    • Data tidak disimpan oleh provider (via API setting)
    │
    └──► Local Model (Ollama/vLLM)
         • Semua data tetap di on-premise
         • Ideal untuk data sensitif
```

### 7.2 Data Residency Compliance

```rego
# data_residency.rego
package data_residency

# Default: allow
default allow = true

# Deny if data contains sensitive info and model is external
deny["Data contains sensitive information cannot be sent to external model"] {
    input.text_contains_sensitive == true
    not input.model_is_local
}

# Flag if student under 13 and data goes external
deny["Student data cannot be sent to external AI services"] {
    input.user.age < 13
    not input.model_is_local
}
```

### 7.3 Audit Trail

Semua interaksi tercatat di `AuditLog`:

| Event | Detail yang Dicatat |
|---|---|
| Chat terkirim | user_id, session_id, model_id, token_count, latency, cost |
| Filter triggered | filter_name, action (block/flag/redirect), reason |
| Policy violation | policy_id, rule matched, action taken |
| Model switch | old_model, new_model, reason (cost/policy/error) |
| Admin action | admin_id, action, target, details |
| Error | error_type, model_id, user_id, stack_trace (internal) |

---

## 8. Monitoring & Observability

### 8.1 Metrics yang Dilacak

| Kategori | Metrics |
|---|---|
| **Usage** | Total requests, unique users, tokens per day, cost per day/school/user |
| **Performance** | Latency p50/p95/p99 per model, error rate, cache hit ratio |
| **Safety** | Blocked requests %, filter trigger rate per filter type, injection attempt rate |
| **Quality** | User feedback score (thumbs up/down), conversation completion rate |
| **Model** | Model usage distribution, model failover rate, cost per model |

### 8.2 Dashboard (Grafana + Langfuse)

```
┌─────────────────────────────────────────────────────────┐
│  Langfuse Dashboard                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│  │ Total │ │ Active│ │ Avg   │ │ Cost  │              │
│  │ 1.2M  │ │ 3.4K  │ │ 1.2s  │ │ $2.3K │              │
│  │Tokens │ │ Users │ │Latency│ │/week  │              │
│  └───────┘ └───────┘ └───────┘ └───────┘              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Tokens Used Over Time (per model)                │   │
│  │ ▗▄▄▖▗▄▄▄▖▗▄▄▄▖▗▄▄▄▖▗▄▄▄▖▗▄▄▄▖                    │   │
│  │  GPT-4o ── Claude ── Gemini ── Local              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Filter Pipeline: Block Rate                      │   │
│  │ PII: 0.2% │ Injection: 0.5% │ Cheating: 2.1%    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Roadmap Implementasi

### Phase 1: Foundation (Minggu 1-4)
- [x] Setup monorepo (pnpm workspace + turborepo)
- [x] Next.js app skeleton + Tailwind + shadcn/ui
- [x] Prisma schema + migrations
- [x] Authentication (NextAuth.js + SSO integration)
- [x] Python FastAPI AI Gateway skeleton
- [x] Basic chat endpoint (no filter, direct to GPT-4o-mini)
- [x] Role-based UI adaptation

### Phase 2: Filter Pipeline (Minggu 5-8)
- [ ] PII Masking (spaCy + Presidio)
- [ ] Prompt Injection Detection (ONNX)
- [ ] Academic Integrity Gate
- [ ] Content Policy (OPA Rego)
- [ ] Profanity Filter
- [ ] Topic Guardrail
- [ ] Cost Router
- [ ] Context Optimizer
- [ ] Rate Limiter (Redis)
- [ ] Post-filter pipeline

### Phase 3: Model Management (Minggu 9-10)
- [ ] Model Registry CRUD (admin panel)
- [ ] Policy management (admin panel)
- [ ] Multi-provider adapters (OpenAI, Anthropic, Gemini, Ollama)
- [ ] Model selection UI (filtered dropdown)
- [ ] Cost tracking & budgeting

### Phase 4: Subject Agent & RAG (Minggu 11-14)
- [ ] Vector store (pgvector)
- [ ] Document upload & indexing
- [ ] Subject-specific knowledge base
- [ ] Subject agent system prompt management
- [ ] File upload to MinIO/S3

### Phase 5: Project Folder (Minggu 15-16)
- [ ] Project CRUD
- [ ] File explorer UI
- [ ] Version history
- [ ] Sharing & permissions
- [ ] Integration with chat (context from project files)

### Phase 6: Exam Correction (Minggu 17-20)
- [ ] Exam creation UI (dosen)
- [ ] Identity filter pre-processing
- [ ] AI grading with rubric
- [ ] Result dashboard
- [ ] Anti-cheating detection

### Phase 7: Advanced Features (Minggu 21-28)
- [ ] Adaptive Quiz Generator
- [ ] Plagiarism Checker
- [ ] Literature Review Assistant
- [ ] Citation Generator
- [ ] Research Methodology Advisor
- [ ] Paper Structure Reviewer
- [ ] Data Analysis Assistant
- [ ] Structure & Outline Generator untuk Skripsi/Tesis/Disertasi
- [ ] Proctoring & Anti-Cheating Ringan

### Phase 8: Teaching Tools (Minggu 29-32)
- [ ] Personalized Learning Path
- [ ] Syllabus/RPS Generator (dengan diferensiasi & kurikulum alignment)
- [ ] Meeting/Lecture Transcriber
- [ ] Math Solver Step-by-Step
- [ ] Code Tutor
- [ ] Language Tutor
- [ ] Virtual Lab Simulator
- [ ] Learning Analytics Dashboard — Sentimen Analysis & Prediksi Nilai

### Phase 9: Collaboration & Career (Minggu 33-36)
- [ ] Study Groups with AI Facilitator
- [ ] Knowledge Gap Analyzer
- [ ] Grade Analytics Dashboard
- [ ] AI Discussion Moderator
- [ ] Assignment Scheduler
- [ ] Career Path Recommender
- [ ] University Match Recommender
- [ ] Portfolio Builder
- [ ] Interview Preparation
- [ ] Version Control untuk Dokumen Akademik

### Phase 10: Engagement & Accessibility (Minggu 37-42)
- [ ] Gamification — Badges, XP, Leaderboard, Streaks, Daily Challenges
- [ ] Multilingual Support — Bahasa daerah, terjemahan real-time
- [ ] TTS/STT & Simplified Text (Accessibility)
- [ ] PWA + Offline Mode
- [ ] Push Notification

### Phase 11: Filter Governance (Minggu 43-45)
- [ ] Dual-LLM Security Architecture
- [ ] Klasifikasi Kontekstual 4 Level
- [ ] Human-in-the-Loop Dashboard
- [ ] Active learning loop dari feedback manual

### Phase 12: Optimization & Scale (Minggu 46-50)
- [ ] On-premise model deployment (Ollama/vLLM)
- [ ] Caching layer (Redis)
- [ ] Monitoring & observability (Langfuse)
- [ ] Load testing & optimization
- [ ] Documentation & training
- [ ] Production deployment

---

## 10. Contoh Konfigurasi Model Registry & Policy

### 10.1 Model Registry (Admin UI → Database)

```json
// Example seed data for model registry
[
  {
    "name": "GPT-4o",
    "modelId": "gpt-4o",
    "provider": "OPENAI",
    "capabilities": ["CHAT", "CODE", "IMAGE_UNDERSTANDING", "DOCUMENT_PARSING", "MATH_REASONING"],
    "maxTokens": 128000,
    "costPerInput": 0.0025,
    "costPerOutput": 0.01,
    "isLocal": false,
    "allowedRoles": ["S1", "S2", "S3", "TEACHER", "LECTURER", "ADMIN"],
    "allowedSubjects": [],
    "minGradeLevel": 10,
    "rateLimitRPM": 10,
    "rateLimitTPM": 100000
  },
  {
    "name": "Gemini 2.0 Flash",
    "modelId": "gemini-2.0-flash",
    "provider": "GOOGLE",
    "capabilities": ["CHAT", "CODE", "IMAGE_UNDERSTANDING", "MATH_REASONING"],
    "maxTokens": 32000,
    "costPerInput": 0.0001,
    "costPerOutput": 0.0004,
    "isLocal": false,
    "allowedRoles": ["SD", "SMP", "SMA", "S1", "S2", "S3", "TEACHER", "LECTURER", "ADMIN"],
    "allowedSubjects": [],
    "minGradeLevel": 1,
    "rateLimitRPM": 30,
    "rateLimitTPM": 200000
  },
  {
    "name": "Llama 3 (On-Premise)",
    "modelId": "llama-3-70b",
    "provider": "OLLAMA",
    "capabilities": ["CHAT", "CODE", "MATH_REASONING"],
    "maxTokens": 8192,
    "costPerInput": 0.0,
    "costPerOutput": 0.0,
    "isLocal": true,
    "allowedRoles": ["SD", "SMP", "SMA", "S1", "S2", "S3", "TEACHER", "LECTURER", "ADMIN"],
    "allowedSubjects": [],
    "minGradeLevel": 1,
    "rateLimitRPM": 60,
    "rateLimitTPM": 500000
  }
]
```

### 10.2 Policy Examples

```yaml
# Kebijakan 1: Model untuk siswa SD
- name: "SD Model Restriction"
  type: model_selection
  rules:
    allowed_providers: [ANTHROPIC, GOOGLE, OLLAMA]
    max_tokens: 8192
    blocked_capabilities: [IMAGE_GENERATION, WEB_SEARCH]
    require_safe_search: true
  apply_to_roles: [SD]
  priority: 100

# Kebijakan 2: Data residency
- name: "Sensitive Data Must Stay On-Premise"
  type: data_residency
  rules:
    conditions:
      - if: "input.text contains NIM or input.text contains alamat"
        then: "route to local model only"
  apply_to_roles: [S1, S2, S3, LECTURER]
  priority: 90

# Kebijakan 3: Budget per bulan per user
- name: "Monthly Budget Cap"
  type: rate_limit
  rules:
    monthly_budget_per_user: 5.00  # USD
    over_budget_action: "downgrade_to_cheapest_model"
  apply_to_roles: [SD, SMP, SMA, S1]
  priority: 50
```

---

## 11. Arsitektur Deployment

### 11.1 Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: binus_ai
      POSTGRES_USER: binus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  opa:
    image: openpolicyagent/opa:latest
    command: run --server --watch /policies
    volumes:
      - ./apps/ai-gateway/app/policies:/policies
    ports:
      - "8181:8181"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  ai-gateway:
    build:
      context: .
      dockerfile: docker/Dockerfile.gateway
    ports:
      - "8000:8000"
    depends_on:
      - redis
      - opa

volumes:
  postgres_data:
  minio_data:
```

### 11.2 Production Architecture

```
Cloudflare / CDN
    │
    ▼
Load Balancer (NGINX / AWS ALB)
    │
    ├── Next.js App (Vercel / ECS Fargate)
    │   └── Serverless Postgres (Neon / RDS Proxy)
    │
    └── AI Gateway (ECS Fargate / GKE)
        ├── Redis (ElastiCache / Memorystore)
        ├── OPA (sidecar container)
        ├── MinIO / S3
        └── Local GPU Server (for local models)
```

---

## 12. Kesimpulan

Rancangan ini mencakup:

1. **17 fitur utama** di luar chat, project folder, subject agent, dan exam correction — termasuk proctoring, gamification, offline/PWA, career prep, dan accessibility
2. **Filter pipeline 10 lapis** + **Dual-LLM Security Architecture** + **Human-in-the-Loop** sebagai lapisan keamanan berlapis
3. **Klasifikasi kontekstual 4 level** (Safe → Content Guidance → Highly Sensitive → Toxic) menggantikan binary block/allow
4. **Model selection dengan policy engine** (OPA) yang bisa dikonfigurasi per sekolah
5. **Role-based adaptation** untuk 9 peran pengguna (SD s.d. Dosen)
6. **Hybrid architecture**: Next.js untuk UX + Python untuk AI safety
7. **On-premise model support** via Ollama/vLLM untuk data sensitif
8. **Multilingual & accessibility** — TTS/STT, simplified text, dukungan bahasa daerah
9. **Full audit trail & monitoring** untuk compliance dan optimasi biaya

## 13. Lampiran: Glossary

| Istilah | Definisi |
|---|---|
| **AI Gateway** | Python microservice yang menangani filtering, routing, dan policy enforcement untuk semua request ke AI |
| **OPA (Open Policy Agent)** | Policy engine yang mengeksekusi kebijakan sebagai kode (Rego language) |
| **Presidio** | Library Microsoft untuk PII detection dan anonymization |
| **RAG (Retrieval-Augmented Generation)** | Teknik menggabungkan informasi dari knowledge base dengan LLM |
| **Subject Agent** | AI yang dikustomisasi per mata pelajaran dengan knowledge base spesifik |
| **Identity Filter** | Filter yang mendeteksi dan meredact identitas pengguna sebelum diproses AI |
| **Cost Router** | Mekanisme routing query ke model AI berdasarkan biaya dan kompleksitas |
| **pgvector** | Extension PostgreSQL untuk vector similarity search |
| **SSO (Single Sign-On)** | Autentikasi terpadu via LDAP/SAML/Google Workspace |
| **Dual-LLM Architecture** | Arsitektur keamanan dua model: LLM-1 sebagai security filter, LLM-2 sebagai response generator — memisahkan moderasi dari generasi konten |
| **Klasifikasi Kontekstual 4 Level** | Sistem klasifikasi konten: Safe, Content Guidance (14 sub-kategori), Highly Sensitive, Toxic — menggantikan binary block/allow |
| **Human-in-the-Loop (HITL)** | Mekanisme review manual untuk konten ambiguous yang tidak bisa diputuskan oleh filter otomatis |
| **Proctoring** | Sistem pengawasan ujian digital: deteksi pola jawaban mencurigakan, verifikasi identitas periodic, browser lockdown |
| **Gamification** | Elemen permainan dalam pembelajaran: badges, XP, leaderboard, streaks, daily challenges |
| **PWA (Progressive Web App)** | Aplikasi web yang bisa diinstal seperti native app, mendukung offline mode dan push notification |
| **TTS/STT** | Text-to-Speech dan Speech-to-Text untuk accessibility dan input suara |
| **Simplified Text** | Mode penyederhanaan teks kompleks menjadi kalimat pendek untuk siswa disleksia/kesulitan membaca |
| **Diferensiasi Pembelajaran** | Penyesuaian materi dan aktivitas berdasarkan kecepatan dan gaya belajar masing-masing siswa |
