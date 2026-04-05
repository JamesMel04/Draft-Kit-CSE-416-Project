# Backend Service Endpoints

Base URL (local development):

```txt
http://localhost:4000
```

All requests and responses use JSON.

## Endpoint Summary

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | `/` | Serves `public/index.html` |
| GET | `/players` | List players with optional filter/sort/pagination |
| GET | `/players/:id` | Get one player by ID |
| GET | `/players/:id/notes` | Get notes for a player (placeholder) |
| POST | `/players/:id/notes` | Save notes for a player (placeholder) |
| GET | `/compare` | Compare two players (test-data based) |
| GET | `/drafts/saved` | Fetch saved drafts (currently placeholder, returns 500) |
| GET | `/drafts/:id` | Get one draft by ID |
| POST | `/drafts/:id/player` | Add player to draft (placeholder) |
| GET | `/evaluation/players` | Fetch evaluated players from evaluator API |
| GET | `/evaluation/drafts` | Build draft evaluations from rosters + evaluator API |

## Players

### GET `/players`

Returns player data with optional name filter, sorting, and pagination.

Query params:

| Name | Type | Default | Notes |
| ---- | ---- | ------- | ----- |
| `name` | string | `""` | Case-insensitive substring filter |
| `sort` | string | `suggestedValue` | Falls back to `suggestedValue` if invalid |
| `asc` | boolean | `false` | `true` for ascending |
| `page` | number | `1` | 1-based |
| `limit` | number | `25` | max 100 |

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
  ],
  "pagination": {
    "total": 4,
    "page": 1,
    "limit": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "sorting": {
    "sort": "suggestedValue",
    "asc": false
  }
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

## Compare

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

## Drafts

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

## Evaluation

### GET `/evaluation/players`

Forwards filters to evaluator API, then paginates locally.

Query params:

| Name | Type | Notes |
| ---- | ---- | ----- |
| `playerIds` | csv string | Example: `player1,player2` |
| `positions` | csv string | |
| `alreadyTakenIds` | csv string | |
| `minPrice` | number | |
| `maxPrice` | number | |
| `name` | string | |
| `sort` | string | |
| `asc` | boolean | |
| `page` | number | default 1 |
| `limit` | number | default 25, max 100 |

Response shape:

```json
{
  "players": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 25,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "sorting": { "sort": "suggestedValue", "asc": false },
  "meta": {
    "source": "backend",
    "provider": "external-evaluator",
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "notes": "Player evaluations sourced from API."
  }
}
```

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
