## Final Echo MVP

Grundgeruest fuer ein Digital-Legacy-MVP mit Next.js App Router, Tailwind CSS und Supabase.

## Online deployen auf Vercel

1. Repository zu GitHub pushen.
2. Projekt in Vercel importieren.
3. In Vercel unter **Settings -> Environment Variables** setzen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy ausloesen.

Wichtig: Vorher die SQL-Migration aus `supabase/migrations/20260916010000_initial_digital_legacy.sql`
in deinem Supabase-Projekt ausfuehren, damit Tabellen, Buckets und RLS vorhanden sind.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Aktuelle Routen

- `/` Landingpage mit vertrauensbildender Positionierung
- `/dashboard` vorbereiteter geschuetzter Bereich fuer Uploads, Voucher und Recipients
- `/report` oeffentliches Melde-Portal fuer Sterbeurkunden

## Supabase in Next.js

Server Components:

```ts
import { createServerSupabaseClient } from "@/lib/supabase/server";

const supabase = await createServerSupabaseClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

Client Components:

```ts
"use client";

import { createClientSupabaseClient } from "@/lib/supabase/client";

const supabase = createClientSupabaseClient();
```

Proxy fuer Session-Refresh liegt in `src/proxy.ts` und `src/lib/supabase/middleware.ts`.

## Lokal testen

```bash
cp .env.example .env.local
npm run dev
```

Wenn noch keine echten Supabase-Werte vorliegen, funktionieren `/` und `/report`
sofort. `/dashboard` bleibt ebenfalls aufrufbar und zeigt einen Konfigurationshinweis
statt an Supabase zu scheitern.
