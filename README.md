# Wattsup for OpenRouter

A Next.js application that fetches rankings data from OpenRouter and
visualises token usage for both AI models and apps.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## API

The backend API is exposed through a Next.js route at `/api/rankings`.
It returns model and app usage for day, week and month periods.

```
{
  "modelUsage": {"day": [...], "week": [...], "month": [...]},
  "appUsage": {"day": [...], "week": [...], "month": [...]} 
}
```

## License

This project is released under the **MIT License**.  
See the `LICENSE` file at the root of the repository for the full text.

### Third-Party Components

This project includes source code originally developed by **Ecologits**, distributed under the **Mozilla Public License 2.0 (MPL-2.0)**.

All MPL-2.0–licensed files include the appropriate license header, and the full text of the MPL-2.0 license is available in `LICENSE-MPL-2.0`.