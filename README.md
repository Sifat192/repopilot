# RepoPilot

AI-powered GitHub documentation generator and updater, deployed on Vercel.

## AI setup

1. Create a Gemini API key at https://aistudio.google.com/apikey.
2. In Vercel project Settings → Environment Variables, add `GEMINI_API_KEY` (Production).
3. Optionally set `GEMINI_MODEL=gemini-2.5-flash`.
4. Redeploy the production deployment.

The free Gemini tier is subject to availability, region and rate limits. Do not commit API keys.

## Development

```bash
npm install
npm run dev
```

The current MVP supports public GitHub repositories and Markdown download. GitHub PR publishing, OAuth providers, and donation checkout require additional setup.
