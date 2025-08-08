# WattsUp LLM Rankings

A Next.js application that fetches rankings data from OpenRouter and
visualises token usage for both AI models and apps.

## Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000\> in your browser.

## API

The backend API is exposed through a Next.js route at `/api/rankings`.
It returns model and app usage for day, week and month periods.

```
{
  "modelUsage": {"day": [...], "week": [...], "month": [...]},
  "appUsage": {"day": [...], "week": [...], "month": [...]} 
}
```

If OpenRouter cannot be reached the API falls back to bundled sample
fixtures (`sample-data.json`).
