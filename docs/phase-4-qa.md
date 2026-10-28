# RepoPilot Phase 4 — release QA

## Automated checks
GitHub Actions runs TypeScript and Next.js production build on main pushes and pull requests. No Gemini calls are needed.

## Manual verification (must pass before marking Phase 4 complete)
1. Check GitHub Actions for a green **Build and typecheck** run. Check Vercel's latest deployment is Ready.
2. Open landing, sign-in, dashboard and Studio at 375px, 768px and desktop widths. Check no horizontal overflow, no hidden navigation, usable editor and buttons, and readable light/dark themes.
3. Sign out, sign in with GitHub, confirm homepage redirect, account badge and success notification. Confirm sign-out resets the account display.
4. Visit `/api/dashboard` and `/api/activity` signed out: both should return 401. Signed in, verify only your account's activity appears.
5. Verify malformed URLs, invalid JSON, and oversized API bodies return safe errors. Do not send secrets in test payloads.
6. Use the existing successful generation and PR activity records for read-only history tests. Verify Refresh activity and GitHub PR link work.
7. Confirm publishing to repositories without write access is denied. Do not merge the existing draft PR just to test.
8. Verify Upstash rate limits and publishing lock behavior using isolated tests or controlled staging, not repeated production Gemini generations.
9. Verify server error responses never include OAuth tokens, Supabase service role credentials, or Gemini keys.
10. Review accessibility: keyboard focus, reduced motion, form labels, error announcements and screen-reader status text.

## Security and privacy remaining before public launch
- Configure production monitoring/alerts and error retention.
- Add a documented privacy policy and activity-data retention/deletion mechanism.
- Review repository-content redaction: regex filtering is best-effort, not a guarantee that arbitrary secrets cannot reach Gemini. Warn users not to submit repositories containing secrets.
- Add automated API integration tests with mocked GitHub/Gemini/Redis/Supabase responses and cross-user authorization tests.
- Run load tests against a staging environment before broad public launch.

This checklist distinguishes code implementation from verified results; don't mark a test passed until run.
