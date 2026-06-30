# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The line above is not decorative. This repo runs **Next.js 16.2.9** + **React 19**. Treat your memorized Next.js/React APIs as potentially stale and consult `node_modules/next/dist/docs/` before writing framework code.

## What this is

YasyaBook is a **single-user** education-notes workspace: a Tiptap rich-text editor backed by one Supabase `notes` table. There is no multi-user model and **no real authentication** (see below).

Stack: Next.js 16 App Router · React 19 · Supabase (`@supabase/ssr`) · Tiptap 3 · Tailwind CSS v4 · TypeScript.

## Commands

```bash
npm run dev      # dev server (next dev)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config; runs `eslint`, NOT `next lint`)
```

There is **no test framework** configured — don't assume one exists.

Database (Supabase CLI):

```bash
npx supabase link --project-ref umyptgrtubaxrgnxedao   # one-time
npx supabase migration new describe_your_change        # create a migration
npx supabase db push                                   # apply to remote
```

## Authentication is intentionally absent — do not "fix" it

- `AccessGate` ([components/access-gate.tsx](components/access-gate.tsx)) is **cosmetic only**. It compares the typed code to `NEXT_PUBLIC_ACCESS_CODE` *in the browser* and records the unlock in `sessionStorage`, scoped per browser tab via a UUID stashed in `history.state`. It gates nothing on the server.
- The Supabase `notes` table grants the **`anon` role full CRUD** through permissive RLS policies (see the migration). Anyone with the public key can read/write all notes. This is a deliberate design choice for a private single-user app, documented in [README.md](README.md).
- Do not add server-side auth assumptions, per-user filtering, or "secure" the access code unless explicitly asked — it would break the intended model.

## Architecture

**Everything is a client component.** `app/page.tsx` renders `NotesApp` → `AccessGate` wraps `NotesWorkspace`. All data access happens in the browser.

**Data layer** — [lib/notes.ts](lib/notes.ts) is the only DB module the UI uses. It calls the **browser** Supabase client ([lib/supabase/client.ts](lib/supabase/client.ts)) directly. `createClient()` is called fresh per query. Notes are stored as Tiptap `JSONContent` in a `jsonb` column.

- [lib/supabase/server.ts](lib/supabase/server.ts) exists (cookie-based server client) but is **currently unused** — there are no Server Components, Route Handlers, or Server Actions touching the DB.
- [lib/database.types.ts](lib/database.types.ts) is **hand-maintained**, not generated. It exports both the Supabase `Database` type and the app-facing `Note` type (whose `content` is typed as Tiptap `JSONContent`). Keep it in sync with migrations by hand.

**Save model** — the editor owns saving; the workspace coordinates it.

- [components/rich-text-editor.tsx](components/rich-text-editor.tsx) debounces edits (750ms) and autosaves. It exposes an imperative handle via `forwardRef`: `saveNow(): Promise<boolean>` and `focusTitle()`.
- [components/notes-app.tsx](components/notes-app.tsx) calls `editorRef.current.saveNow()` **before** switching or creating a note. If it returns `false` (save failed), the navigation is blocked and an error is shown — this prevents losing unsaved edits across note switches.
- The editor is remounted per note via `key={selectedNote.id}`; refs (`dirtyRef`, `activeNoteIdRef`, `savePromiseRef`) guard against races when a save resolves after the active note changed.
- `updated_at` is set by a **DB trigger** on update, not by the client. After each save the sidebar re-sorts notes by `updated_at` desc.

## Database & migrations workflow

- Schema lives in `supabase/migrations/`. The repo is wired to the **Supabase GitHub integration** (production branch `main`): merging a migration to `main` auto-applies it. **Do not** make schema changes in the Supabase Dashboard.
- Always express schema changes as a new migration file (`supabase migration new …`), then commit.
- The baseline migration creates `notes`, an `updated_at` index, the `set_notes_updated_at` trigger, enables RLS, and grants `anon` full CRUD.

## Environment

All env vars are public (`NEXT_PUBLIC_*`), set in `.env.local` (see [.env.example](.env.example)):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_ACCESS_CODE` — the cosmetic gate code

## Conventions

- Import alias `@/*` maps to the repo root (e.g. `@/lib/notes`, `@/components/...`).
- Styling is a single global stylesheet, `app/globals.css` (Tailwind v4 via `@tailwindcss/postcss`); components use semantic class names defined there rather than utility classes inline.
- Icons come from `lucide-react`.
