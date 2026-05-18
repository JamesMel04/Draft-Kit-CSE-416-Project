import { Router, Request, Response } from 'express';
import { testDraftDataSet } from '../data/test-data';
import { randomUUID } from 'crypto';
import { DraftData, PlayerID, Position } from '../types';
import { parseStringQuery } from '../utils/parsers';
import { Pool } from "pg";

const router = Router();

type DraftRow = {
  userid?: string;
  userId?: string;
  user_id?: string;
  id: string;
  teamname?: string;
  teamName?: string;
  team_name?: string;
  roster?: unknown;
};

let draftPool: Pool | null = null;
if (process.env.DB_LINK) {
  draftPool = new Pool({
    connectionString: process.env.DB_LINK,
    ssl: { rejectUnauthorized: false }
  });
}
// Else it'll use your local instance
// If you want to test locally via downloading and running your own Postgres instance,
// Just delete the env variable and run on port 5432
else if (process.env.DB_PASSWORD) {
  draftPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'mlbtest',
    user: 'postgres',
    password: process.env.DB_PASSWORD, //Whatever you set as your local password
  });
}
else {
  console.warn('No draft database configured; using in-memory draft data.');
}

draftPool?.on('error', (error) => {
  console.error('Draft database pool error:', error);
});

function parsePlayerId(value: unknown): PlayerID | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDraftRoster(roster: unknown): DraftData['roster'] {
  if (typeof roster === 'string') {
    try {
      return parseDraftRoster(JSON.parse(roster));
    } catch {
      return {};
    }
  }

  if (typeof roster !== 'object' || roster === null) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(roster)
      .map(([position, playerId]) => [position as Position, parsePlayerId(playerId)] as const)
      .filter(([, playerId]) => playerId !== undefined)
  ) as DraftData['roster'];
}

function normalizeDraftRow(row: DraftRow): DraftData {
  return {
    userId: row.userid ?? row.userId ?? row.user_id ?? 'anonymous-user',
    id: row.id,
    teamName: row.teamname ?? row.teamName ?? row.team_name ?? '',
    roster: parseDraftRoster(row.roster),
  };
}

function findSavedDrafts(userId: string): DraftData[] {
  return testDraftDataSet.filter((draft) => draft.userId === userId);
}

router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';

    if (!draftPool) {
      return res.json({ drafts: findSavedDrafts(userId) });
    }

    const result = await draftPool.query<DraftRow>(
      "SELECT * FROM drafts WHERE userId=$1",
      [userId]
    );
    const drafts = result.rows.map(normalizeDraftRow);
    res.json({ drafts });
  } catch (error) {
    console.error('Saved drafts API error:', error);
    res.status(500).json({ error: 'Failed to fetch saved drafts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';
    const { id } = req.params;

    if (!draftPool) {
      const draft = testDraftDataSet.filter(d => d.userId === userId).find(d => d.id === id);
      return draft ? res.json({ draft }) : res.status(404).json({ error: 'Draft not found' });
    }

    const result = await draftPool.query<DraftRow>(
      "SELECT * FROM drafts WHERE userId=$1 AND id=$2",
      [userId, id]
    );
    const draft = result.rows[0] ? normalizeDraftRow(result.rows[0]) : null;
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json({ draft });
  } catch (error) {
    console.error('Draft fetch API error:', error);
    res.status(500).json({ error: 'Failed to fetch draft data' });
  }
});

// Create/Update a draft
router.post('/', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';
    const id = parseStringQuery(req.body.id, '');
    const teamName = parseStringQuery(req.body.teamName, '');
    const roster = parseDraftRoster(req.body.roster);
    if (id) {
      // Update existing draft
      if (!draftPool) {
        const draftIndex = testDraftDataSet.findIndex((draft) => draft.userId === userId && draft.id === id);
        if (draftIndex === -1) {
          return res.status(404).json({ error: 'Draft not found' });
        }

        const draft = { ...testDraftDataSet[draftIndex], teamName, roster };
        testDraftDataSet[draftIndex] = draft;
        return res.json({ status: 'updated', draft });
      }

      const result = await draftPool.query<DraftRow>(
        "UPDATE drafts SET teamname=$1, roster=$2 WHERE userId=$3 AND id=$4 RETURNING *",
        [teamName, JSON.stringify(roster), userId, id]
      );
      const draft = result.rows[0] ? normalizeDraftRow(result.rows[0]) : null;
      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      res.json({ status: 'updated', draft });
    } else {
      // Create new draft
      const draft: DraftData = { userId, id: randomUUID(), teamName, roster };

      if (!draftPool) {
        testDraftDataSet.push(draft);
        return res.json({ status: 'created', draft });
      }

      const result = await draftPool.query<DraftRow>(
        "INSERT INTO drafts (userId, id, teamname, roster) VALUES ($1, $2, $3, $4) RETURNING *",
        [draft.userId, draft.id, draft.teamName, JSON.stringify(draft.roster)]
      );
      res.json({ status: 'created', draft: normalizeDraftRow(result.rows[0]) });
    }
  } catch (error) {
    console.error('Draft save API error:', error);
    res.status(500).json({ error: 'Failed to save draft data' });
  }
});

router.post('/:id/player', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';
    const { id } = req.params;
    const playerId = parseStringQuery(req.body.playerId, '');
    const parsedPlayerId = parsePlayerId(playerId);
    const position = parseStringQuery(req.body.position, '') as Position;
    if (!parsedPlayerId || !position) {
      return res.status(400).json({ error: 'playerId and position required in body' });
    }

    if (!draftPool) {
      const draftIndex = testDraftDataSet.findIndex((draft) => draft.userId === userId && draft.id === id);
      if (draftIndex === -1) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      const draft = {
        ...testDraftDataSet[draftIndex],
        roster: { ...testDraftDataSet[draftIndex].roster, [position]: parsedPlayerId },
      };
      testDraftDataSet[draftIndex] = draft;
      return res.json({ player: { id: parsedPlayerId, position }, draft, status: 'added' });
    }

    const existing = await draftPool.query<DraftRow>(
      "SELECT * FROM drafts WHERE userId=$1 AND id=$2",
      [userId, id]
    );
    const draft = existing.rows[0] ? normalizeDraftRow(existing.rows[0]) : null;
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const updatedDraft = {
      ...draft,
      roster: { ...draft.roster, [position]: parsedPlayerId },
    };
    await draftPool.query(
      "UPDATE drafts SET roster=$1 WHERE userId=$2 AND id=$3",
      [JSON.stringify(updatedDraft.roster), userId, id]
    );
    res.json({ player: { id: playerId, position }, draft, status: 'added' });
  } catch (error) {
    console.error('Draft player add API error:', error);
    res.status(500).json({ error: 'Failed to add player to draft' });
  }
});

export default router;
