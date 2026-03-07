# Backend Service Endpoints

Base URL (local development):

```
http://localhost:4000
```

All requests and responses use **JSON**.

---

# Endpoint Summary

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| GET    | `/search`            | Search players by name  |
| GET    | `/players`           | Get all player data     |
| GET    | `/players/:id`       | Get a specific player   |
| GET    | `/players/:id/notes` | Get notes for a player  |
| POST   | `/players/:id/notes` | Add a note to a player  |
| GET    | `/compare`           | Compare two players     |
| GET    | `/draft/:id`         | Get draft data          |
| POST   | `/draft/:id/player`  | Add a player to a draft |

---

# Search Players

**GET** `/search`

Search players by name.

### Query Parameters

| Name | Type   | Description           |
| ---- | ------ | --------------------- |
| name | string | Player name to search |

### Example Request

```
GET /search?name=PlayerName 1
```

### Example Response

```json
{
  "players": [
    {
      "id": "player1",
      "name": "PlayerName 1",
      "team": "PlayerTeam 1",
      "stats": {}
    }
  ]
}
```

---

# Get All Players

**GET** `/players`

Returns all available player data.

### Example Response

```json
{
  "players": [
    {
      "id": "player1",
      "name": "PlayerName 1",
      "team": "PlayerTeam 1",
      "stats": {}
    },
    {
      "id": "player2",
      "name": "PlayerName 2",
      "team": "PlayerTeam 2",
      "stats": {}
    }
  ]
}
```

---

# Get Player By ID

**GET** `/players/:id`

Returns data for a specific player.

### Example Request

```
GET /players/player1
```

### Example Response

```json
{
  "player": {
    "id": "player1",
    "name": "PlayerName 1",
    "team": "PlayerTeam 1",
    "stats": {}
  }
}
```

---

# Get Player Notes

**GET** `/players/:id/notes`

Returns notes associated with a player.

### Example Response

```json
{
  "notes": "Notes"
}
```

---

# Add Player Note

**POST** `/players/:id/notes`

Adds a note for a specific player.

### Request Body

```json
{
  "content": "Notes on Player"
}
```

### Example Response

```json
{
  "content": "Notes on Player",
  "status": "saved"
}
```

---

# Compare Players

**GET** `/compare`

Returns data comparing two players.

### Query Parameters

| Name      | Type   | Description      |
| --------- | ------ | ---------------- |
| playerId1 | string | First player ID  |
| playerId2 | string | Second player ID |

### Example Request

```
GET /compare?playerId1=player1&playerId2=player2
```

### Example Response

```json
{
  "player1": {},
  "player2": {},
  "comparison": {}
}
```

---

# Get Draft Data

**GET** `/draft/:id`

Returns draft information.

### Example Request

```
GET /draft/draft1
```

### Example Response

```json
{
  "draft": {
    "id": "draft1",
    "roster": {
      "C": {},
      "1B": {}
    }
  }
}
```

---

# Add Player To Draft

**POST** `/draft/:id/player`

Adds a player to a draft.

### Request Body

```json
{
  "playerId": "player1",
  "position": "QB"
}
```

### Example Response

```json
{
  "player": {
    "id": "player1",
    "position": "QB"
  },
  "draft": {},
  "status": "added"
}
```

---

# Error Responses

If a request fails, the backend returns an error message.

Example:

```json
{
  "error": "Failed to fetch player data"
}
```

Typical error status codes:

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 400  | Bad request (missing or invalid input) |
| 500  | Internal server error                  |

---
