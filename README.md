# Enterprise AI Knowledge Assistant

A multi-tenant, RAG-based internal knowledge search platform. Organizations upload internal documents (PDFs) and their team members can ask natural-language questions, getting AI-generated answers with citations back to the exact source document and page — instead of hallucinated, unsourced responses.

**Live demo:** https://your-frontend-url.vercel.app
*(Note: backend is on a free tier and may take 30–50s to wake up on first request)*

![Chat demo](screenshots/chat-demo.gif)

## Why I built this

Most "chat with your PDF" projects skip the hardest part of building this for a real company: **multi-tenancy**. This project is architected so that every organization's documents, users, and vector embeddings are strictly isolated from every other organization's — proven with an automated test suite that specifically tries to leak data across tenants and asserts it can't.

## Features

- 🔐 JWT authentication with access/refresh token rotation, bcrypt password hashing
- 🏢 Multi-tenant architecture — every user, document, chunk, and query scoped to an organization
- 👥 Role-based access control (Admin / Member)
- 📄 PDF upload, parsing, and chunking pipeline
- 🔍 Semantic search via vector embeddings (OpenAI) stored in Qdrant
- 💬 RAG-based chat with citation-backed answers (document name + page number)
- 📊 Admin dashboard (org members, document status)
- 🛡️ Rate limiting, centralized error handling, input validation (Zod)
- ✅ Automated multi-tenant isolation test suite (Jest + Supertest)

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   React     │ ───────▶│  Express API      │────────▶│ PostgreSQL  │
│  (Vercel)   │◀─────── │  (Render)         │◀─────── │  (Neon)     │
└─────────────┘         └──────────────────┘         └─────────────┘
                                │      │
                    ┌───────────┘      └───────────┐
                    ▼                               ▼
            ┌───────────────┐               ┌───────────────┐
            │  Qdrant Cloud  │               │  OpenAI API   │
            │  (vectors)     │               │ (embed + LLM) │
            └───────────────┘               └───────────────┘
```

**Document flow:** Upload PDF → extract text per page → chunk with overlap → generate embeddings → store in Qdrant (tagged with `orgId`)

**Query flow:** Ask question → embed question → search Qdrant (filtered by `orgId`) → retrieve top chunks → LLM generates answer with citations → logged to Postgres

## Tech Stack

**Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
**AI/RAG:** OpenAI (embeddings + chat completion), Qdrant (vector database)
**Frontend:** React, Vite, Tailwind CSS, Axios
**Auth:** JWT, bcrypt
**Testing:** Jest, Supertest
**Infra:** Docker Compose (local), Render + Neon + Qdrant Cloud (production), Vercel (frontend)

## Multi-tenant isolation — how it's enforced

This is the core architectural decision of the project. Every tenant-scoped table (`User`, `Document`, `Chunk`, `Query`) carries an `organizationId`, and:

- Every Prisma query filtering documents/users/queries includes `organizationId` in its `where` clause — never trusted from request input, always derived from the authenticated user's JWT
- Every Qdrant vector payload includes `orgId`, and every similarity search has a **mandatory** filter requiring it to match
- An automated test suite (`src/__tests__/multiTenant.test.ts`) creates two separate organizations and asserts Org B can never list, fetch, or retrieve chunk content belonging to Org A — even when guessing a valid document ID directly

Run it yourself:
```bash
cd backend
npm test
```

## Running locally

### Prerequisites
- Node.js 18+
- Docker Desktop
- An OpenAI API key
- A Qdrant instance (local via Docker, or Qdrant Cloud)

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/enterprise-ai-knowledge-assistant.git
cd enterprise-ai-knowledge-assistant

# Start Postgres + Qdrant
docker compose up -d

# Backend
cd backend
npm install
cp .env.example .env   # fill in your own values
npx prisma migrate dev
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Backend runs on `http://localhost:4000`, frontend on `http://localhost:5173`.

### Environment variables

See `backend/.env.example` for the full list — you'll need an OpenAI API key at minimum.

## Project structure

```
backend/
  src/
    controllers/   # HTTP request/response handling
    services/       # business logic (auth, documents, embeddings, RAG)
    middleware/      # auth, RBAC, rate limiting, error handling
    routes/          # route definitions
  prisma/
    schema.prisma    # 5-model schema, all tenant-scoped tables

frontend/
  src/
    pages/          # Login, Register, Dashboard, Chat, Admin
    components/     # FileUploader, ChatMessage, ProtectedRoute
    context/        # AuthContext (global auth state)
    services/       # API client + typed request functions
```

## What I'd build next

- Streaming responses (currently the LLM answer returns all at once)
- Background job queue for document processing (currently synchronous — fine for small PDFs, would bottleneck at scale)
- Refresh-token silent renewal instead of forcing re-login on expiry
- Support for DOCX/TXT in addition to PDF

## License

MIT
