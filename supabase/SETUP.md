# RepoPilot activity history setup

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open **SQL Editor** and execute `supabase/schema.sql`.
3. In Vercel → Project → Settings → Environment Variables, set:
   - `SUPABASE_URL`: Supabase project URL, e.g. `https://YOUR_PROJECT.supabase.co`.
   - `SUPABASE_SERVICE_ROLE_KEY`: server-side **service_role** key from Supabase project API settings.
4. Redeploy RepoPilot and sign in. Successful README generations and draft PRs will now appear in **Dashboard → Recent activity**.

**Security:** Never expose the service role key through `NEXT_PUBLIC_*`, browser code, chat, screenshots or GitHub. It bypasses row-level security and is used only in server routes. No user-supplied identity is accepted by the history endpoint; identity is derived from the signed NextAuth JWT. Database row-level security is enabled with no public read/write policies.

The existing `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` stay in place for rate limiting and PR locks.

Only actions completed **after** database configuration are recorded. Anonymous generations aren't recorded. Metrics summarize the most recent 100 events rather than lifetime totals. Failed Supabase writes are logged server-side but do not block successful README generation or PR publishing. Test database setup and build before public launch.
