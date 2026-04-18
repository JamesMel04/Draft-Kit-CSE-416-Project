# Backend Service

This is the backend for Draft Kit.

Base URL (local development):

```txt
http://localhost:4000
```

All requests and responses use JSON.

## Overview

The backend exposes the REST API for Draft Kit. It serves the homepage, player and draft data, and evaluation routes that either forward to the external evaluator API or fall back to backend player data when needed.

## Scripts

From the `backend` directory:

```bash
npm run dev
npm run build
npm run start
npm run test
```

## Environment Variables

The backend reads the following environment variables:

| Name | Required | Purpose |
| ---- | -------- | ------- |
| `API_URL` | yes | Base URL for the upstream evaluator API used by `/evaluation/players` and `/evaluation/drafts`. |
| `PORT` | no | Port the backend server listens on. Defaults to `4000`. |

Example `.env` file:

```txt
API_URL=https://your-evaluator-api.example.com
PORT=4000
```

## Service Structure

Key backend files and folders:

- `src/server.ts` - Express app setup and route registration.
- `src/routes/` - route handlers for players, compare, drafts, and evaluation.
- `src/utils/` - shared helpers for env vars, API calls, parsing, pagination, and sorting.
- `src/data/` - local test data used by compare and draft routes.
- `public/` - static files served by the backend.

## Notes

- Sorting is handled on the frontend, so backend list routes return data without sorting or pagination metadata.
- `/evaluation/players` falls back to backend player data if the external evaluator API cannot be reached.
- `/evaluation/drafts` still depends on the evaluator API for player ratings used in draft totals.

## Endpoint Summary

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/` | Serves `public/index.html` |
| GET | `/players` | List players with optional name filter |
| GET | `/players/:id` | Get one player by ID |
| GET | `/players/:id/notes` | Get notes for a player (placeholder) |
| POST | `/players/:id/notes` | Save notes for a player (placeholder) |
| GET | `/compare` | Compare two players (test-data based) |
| GET | `/drafts/saved` | Fetch saved drafts (currently placeholder, returns 500) |
| GET | `/drafts/:id` | Get one draft by ID |
| POST | `/drafts/:id/player` | Add player to draft (placeholder) |
| GET | `/evaluation/players` | Fetch evaluated players from evaluator API, with backend fallback to player data if needed |
| GET | `/evaluation/drafts` | Build draft evaluations from rosters + evaluator API |

## Detailed Routes

### GET `/players`

Returns player data with an optional name filter.

Query params:

| Name | Type | Default | Notes |
| ---- | ---- | ------- | ----- |
| `name` | string | `""` | Case-insensitive substring filter |

Example response:

```json
{
  "players": [
    {
      "id": "player1",
      "name": "PlayerName 1",
      "team": "PlayerTeam 1",
      "positions": ["OF1"],
      "suggestedValue": 32,
      "stats": {
        "projection": { "seasons": [2026], "hitter": { "Homeruns": 1 } },
        "lastYear": { "seasons": [2025], "hitter": { "Homeruns": 1 } },
        "threeYearAvg": { "seasons": [2023, 2024, 2025], "hitter": { "Homeruns": 3 } }
      }
    }
  ]
}
```

### GET `/players/:id`

Returns one player object.

### GET `/players/:id/notes`

Current placeholder response:

```json
{ "notes": "Notes" }
```

### POST `/players/:id/notes`

Request body:

```json
{ "content": "Notes on Player" }
```

Response:

```json
{
  "notes": { "id": "player1", "content": "Notes on Player" },
  "status": "saved"
}
```

### GET `/compare`

Query params:

| Name | Type |
| ---- | ---- |
| `playerId1` | string |
| `playerId2` | string |

Response shape:

```json
{
  "player1": {},
  "player2": {},
  "comparison": {}
}
```

### GET `/drafts/saved`

This route is scaffolded but currently returns:

```json
{ "error": "Failed to fetch saved drafts" }
```

### GET `/drafts/:id`

Returns a draft object by ID.

### POST `/drafts/:id/player`

Request body:

```json
{
  "playerId": "player1",
  "position": "C"
}
```

If `playerId` or `position` is missing, returns `400`.

### GET `/evaluation/players`

Forwards filters to the evaluator API and falls back to backend player data if the evaluator is unavailable.

Query params:

| Name | Type | Notes |
| ---- | ---- | ----- |
| `playerIds` | csv string | Example: `player1,player2` |
| `positions` | csv string | |
| `alreadyTakenIds` | csv string | |
| `minPrice` | number | |
| `maxPrice` | number | |
| `name` | string | |

Response shape:

```json
{
  "players": [],
  "meta": {
    "source": "backend",
    "provider": "external-evaluator",
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "notes": "Player evaluations sourced from API."
  }
}
```

When the evaluator API is unavailable, the route returns fallback player evaluations built from the backend player list and uses a backend fallback provider value in `meta`.

### GET `/evaluation/drafts`

Builds draft evaluations by:

1. Selecting drafts from backend test data (or all drafts if `draftIds` not provided).
2. Fetching player evaluations for rostered player IDs from evaluator API.
3. Returning draft totals and slot-level evaluated players.

Query params:

| Name | Type | Notes |
| ---- | ---- | ----- |
| `draftIds` | csv string | Example: `draft1,draft2` |

Response shape:

```json
{
  "drafts": [
    {
      "draftId": "draft1",
      "slots": [
        { "position": "C", "player": null }
      ],
      "totals": {
        "value": 0,
        "score": 0
      }
    }
  ],
  "meta": {
    "source": "backend",
    "provider": "external-evaluator",
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "notes": "Draft evaluations computed from draft rosters and API player evaluations."
  }
}
```

## Error Responses

Error shape:

```json
{ "error": "Failed to fetch player data" }
```

Common status codes:

| Code | Meaning |
| ---- | ------- |
| 400 | Bad request (missing/invalid required input) |
| 500 | Internal server error |
| 502 | Upstream evaluator/API failure |
