# WattsUp LLM Rankings API

A Node.js API server that fetches and serves LLM ranking data from OpenRouter with built-in caching.

## Features

- RESTful API endpoint for rankings data
- 5-minute caching for downloaded HTML content
- Express.js server with error handling
- Health check endpoint

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

The server will run on port 8888 by default (or the PORT environment variable).

## API Endpoints

### GET /rankings

Returns the current LLM rankings data including model usage and app usage statistics for day, week, and month periods.

**Response format:**
```json
{
  "modelUsage": {
    "day": [...],
    "week": [...],
    "month": [...]
  },
  "appUsage": {...}
}
```

### GET /health

Health check endpoint that returns server status.

**Response format:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-08T12:00:00.000Z"
}
```

## Caching

The API implements a 5-minute cache for downloaded HTML content to reduce load on the source website and improve response times for subsequent requests.

## Environment Variables

- `PORT`: Server port (default: 8888)
