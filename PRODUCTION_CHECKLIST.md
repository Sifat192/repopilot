# RepoPilot production verification checklist

The code changes in this phase are not a substitute for a deployed build and browser test. Test without exhausting Gemini quota.

## Build and environment
- [ ] Vercel production deployment builds successfully after latest commits.
- [ ] `NEXTAUTH_SECRET`, GitHub OAuth, Gemini, Upstash, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are present only in server environments where appropriate.
- [ ] No server-only secrets use a `NEXT_PUBLIC_` prefix.
- [ ] The `repopilot_activity` table exists and RLS is enabled.

## API and security
- [ ] Unauthenticated `GET /api/activity` and `GET /api/dashboard` return 401.
- [ ] Invalid JSON, malformed GitHub URLs, URL credentials, query strings, and oversized requests are rejected.
- [ ] Private repositories cannot be generated or published.
- [ ] Publishing to a repository without write access returns 403.
- [ ] Duplicate RepoPilot PR detection returns 409 without opening another PR.
- [ ] Rate limit returns 429 and Retry-After; Upstash outage fails closed.
- [ ] Error responses do not reveal Gemini keys, Supabase credentials, or OAuth tokens.
- [ ] Two different authenticated accounts cannot read each other's activity history.

## Product
- [ ] Landing, sign-in, dashboard, and Studio work in dark and light modes.
- [ ] Dashboard profile and README health handle partial GitHub failures.
- [ ] Activity refresh displays newly saved events without reloading the page.
- [ ] README editor preview, copy, and download work.
- [ ] Changing repository URL after generation blocks accidental publishing to the wrong repo.
- [ ] Successful draft PR creation is visible on GitHub and in activity history.
- [ ] Responsive layout tested at mobile, tablet, and desktop widths.
- [ ] Keyboard focus, form labels, error announcements, and reduced-motion behavior reviewed.

## Remaining launch work
- [ ] Automated build/lint/type checks and regression tests.
- [ ] Load and concurrency testing for rate limits and PR locks.
- [ ] Observability, privacy policy, retention/deletion handling for activity data.
- [ ] Payment gateway and billing integration (deferred until final pre-launch phase).
