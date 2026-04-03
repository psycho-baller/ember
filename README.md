# Ember

**Your AI university superconnector.**

Ember helps university students find clubs and people they should connect with — delivered through WhatsApp, SMS, and a web dashboard. Students message Ember, confirm their university email, and get personalized introductions to clubs and fellow students based on shared interests.

## How it works

1. A student texts Ember on WhatsApp
2. Ember identifies them by their university email (guesses from first name, confirms via reply)
3. Once confirmed, students can ask for club recommendations or say who they want to meet
4. Ember searches a shared knowledge graph of students and a vector-indexed club database, then sends warm introductions on their behalf

Currently deployed for University of Calgary and University of Waterloo.

## Stack

- **Next.js 15** (App Router, Turbopack)
- **Supabase** — auth, profiles, clubs (pgvector), conversation sessions, warm intros
- **Twilio** — WhatsApp and SMS inbound/outbound
- **VAPI** — AI voice calls
- **Zep Cloud** — shared student knowledge graph
- **Vercel AI SDK + OpenAI** — gpt-4o for chat, text-embedding-3-small for club search
- **PocketFlow** — lightweight state machine for the onboarding + chat conversation flow

## Local setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy the env template and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

   Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `ZEP_API_KEY`, `ZEP_GRAPH_ID`

3. Start the dev server:
   ```bash
   bun dev
   ```

4. To receive WhatsApp webhooks locally, expose your dev server with ngrok and point your Twilio WhatsApp sandbox to `https://<your-ngrok>.ngrok.io/api/whatsapp/webhook`.

## Testing

Use mock mode to test the conversation flow without real users. Set `ZEP_GRAPH_ID` to any value containing `"mock"` — this redirects all messages to `RAMI_PHONE_NUMBER` and uses hardcoded test user data instead of live Supabase lookups.

```bash
bun test:tool    # Test Zep graph tool queries
```
