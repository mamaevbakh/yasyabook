# YasyaBook

A single-user education notes workspace built with Next.js, Supabase, and
Tiptap.

## Setup

1. Copy `.env.example` to `.env.local` and add the Supabase project values.
2. Link the Supabase CLI and apply migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref umyptgrtubaxrgnxedao
   npx supabase db push
   ```

3. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

The access-code screen is a visual convenience only. Because the app does not
use authentication, the migration intentionally gives the anonymous Supabase
role full access to the shared `notes` table.

## Database workflow

The repository is connected to the Supabase GitHub integration with:

- Working directory: `.`
- Production branch: `main`
- Deploy to production: enabled

Create every future database change as a new migration:

```bash
npx supabase migration new describe_your_change
```

Edit the generated SQL file under `supabase/migrations`, then commit it.
Supabase applies pending migrations automatically when the commit reaches
`main`. Do not make production schema changes directly in the Dashboard after
this baseline migration.
