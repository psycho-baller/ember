# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev          # Start dev server with Turbopack on localhost:3000
bun build        # Production build
bun lint         # ESLint via next lint

# Supabase scripts (run directly via bun)
bun create:ontology    # lib/zep/ontology.ts — seed Zep graph ontology
bun create:mock-data   # lib/zep/mock_data.ts — populate mock user data
bun test:tool          # lib/zep/test_tool.ts — test Zep tool queries
```

Setup: copy `.env.example` → `.env.local` and fill in all keys.

## Architecture

**Ember** is an AI university superconnector — a Next.js 15 app that helps students find people and clubs at their university via WhatsApp/SMS and a web dashboard.

### Request entry points

| Channel | Route | Description |
|---|---|---|
| WhatsApp inbound | `app/api/whatsapp/webhook/` | Twilio webhook, validated by signature |
| SMS inbound | `app/api/sms/webhook/` | Twilio SMS variant |
| VAPI webhook | `app/api/webhooks/vapi/` | Voice AI call events |
| Web dashboard | `app/(dashboard)/` | Auth-gated Next.js pages |

### Core conversation loop (`lib/pocketflow/`)

WhatsApp messages run through a **PocketFlow** state machine persisted in Supabase (`flow_sessions` table):

1. `CheckConfirmationNode` — has the user linked their university email yet?
2. `AskForEmailNode` / `ParseEmailOrConfirmationNode` / `VerifyAndLinkNode` — onboarding flow that guesses the email from first name (fuzzy Postgres search) and links the phone number to the profile
3. `ChatNode` — once confirmed, gpt-4o chat with four tools:
   - `searchClubs` — vector search (pgvector) against clubs table filtered by university
   - `extractUserInfoAndConnections` — fetches the student's Zep knowledge-graph node and their second-degree neighbors
   - `searchPeople` — semantic search over Student nodes in the Zep shared graph
   - `sendWarmIntro` — inserts a `warm_intros` row and delivers the message via WhatsApp/email

### LLM layer (`lib/llm.ts`)

Three helpers built on Vercel AI SDK (`ai` package) + `@ai-sdk/openai`:
- `callLlm` — basic chat with configurable system prompt and model
- `callLlmJson<T>` — structured output with a Zod schema via `generateObject`
- Default model everywhere is `gpt-4o-mini`; `ChatNode` uses `gpt-4o`

### Memory & knowledge graph (`lib/zep/`)

Zep Cloud is used as a **shared knowledge graph** across all users (not per-user memory). Each WhatsApp message adds:
1. A `Student` node (if new) to the shared graph
2. The message text as a graph edge/node

Queries (`lib/zep/queries.ts`) traverse the graph to find students with shared interests via second-degree neighbor lookup.

### Data layer (`lib/supabase/`)

- `server.ts` / `client.ts` / `middleware.ts` — Supabase SSR client setup with cookie-based auth
- `queries.ts` — all DB calls: profiles, flow_sessions, clubs (vector search via `match_clubs` RPC), warm_intros
- Club vector embeddings use `text-embedding-3-small` via `@ai-sdk/openai`
- `LOCATION_ID` env var (or `TWILIO_PHONE_NUMBER` heuristic) switches between `"uofc"` (Calgary) and `"uw"` (Waterloo)

### Auth

Supabase Auth with cookie-based sessions. `middleware.ts` calls `updateSession` on every non-static request. The `(dashboard)` route group is auth-gated. Auth routes live under `app/auth/`.

### UI

- shadcn/ui components in `components/ui/`
- Landing page in `components/landing/`
- Tailwind CSS v4 with `tailwindcss-animate`
- Dark mode default via `next-themes`
- `sonner` for toast notifications

### Mock mode

When `ZEP_GRAPH_ID` contains `"mock"`, `lib/supabase/queries.ts` short-circuits email lookups to hardcoded test users and redirects to `RAMI_PHONE_NUMBER`. This is the only way to test the full WhatsApp flow without real users.
