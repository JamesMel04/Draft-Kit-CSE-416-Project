import { Router, Request, Response } from 'express';
import { testDraftDataSet } from '../data/test-data';
import { randomUUID } from 'crypto';
import { DraftData, Position } from '../types';
import { parseStringQuery, parseRoster } from '../utils/parsers';
import {Pool} from "pg";

const router = Router();
let draftPool:any;
if(process.env.DB_LINK) {
    draftPool=new Pool({
    connectionString: process.env.DB_LINK,
    ssl:{rejectUnauthorized: false}
  });
}
// Else it'll use your local instance
// If you want to test locally via downloading and running your own Postgres instance,
// Just delete the env variable and run on port 5432
else {
    draftPool=new Pool({
    host: 'localhost',
    port: 5432,
    database: 'mlbtest',
    user: 'postgres',
    password: process.env.DB_PASSWORD, //Whatever you set as your local password
  });
}
router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';

    const drafts = draftPool.query("SELECT * FROM drafts WHERE userId=$1",userId).rows;
    res.json({ drafts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved drafts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';
    const { id } = req.params;

    //const draft = testDraftDataSet.filter(d => d.userId === userId).find(d => d.id === id); // Placeholder for actual API call
    const draft=draftPool.query("SELECT * FROM drafts WHERE userId=$1 AND id=$2",userId,id).rows;
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch draft data' });
  }
});

// Create/Update a draft
router.post('/', async (req: Request, res: Response) => {
  console.log("called");
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';
    const id = parseStringQuery(req.body.id, '');
    const teamName = parseStringQuery(req.body.teamName, '');
    const roster = parseRoster(req.body.roster);
    if (id) {
      // Update existing draft
      let draft=draftPool.query("SELECT * FROM drafts WHERE userId=$1 AND id=$2",userId,id);
      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      draft.teamName = teamName ?? '';
      draft.roster = roster ?? {};
      draft=draftPool.query("UPDATE drafts SET teamName=$1, roster=$2 WHERE id=$3",teamName,roster,id);
      res.json({ status: 'updated', draft });
    } else {
      // Create new draft
      const draft: DraftData = { userId, id: randomUUID(), teamName: teamName, roster: roster ?? {} };
      const status=draftPool.query("INSERT INTO drafts VALUES ($1,$2,$3,$4)", userId,id,teamName,roster);// Add to test data set for retrieval
      res.json({ status, draft });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save draft data' });
  }
});

router.post('/:id/player', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';
    const { id } = req.params;
    const playerId = parseStringQuery(req.body.playerId, '');
    const position = parseStringQuery(req.body.position, '');
    if (!playerId || !position) {
      return res.status(400).json({ error: 'playerId and position required in body' });
    }
    // Add player to draft based on id, player_id, and position
    //const draft = testDraftDataSet.filter(d => d.userId === userId).find(d => d.id === id); // Placeholder for actual API call
    let draft=draftPool.query("SELECT * FROM drafts WHERE userId=$1 AND id=$2",userId,id);
    draft.roster={...draft.roster,position:{number:playerId}};
    res.json({ player: { id: playerId, position }, draft, status: 'added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add player to draft' });
  }
});

export default router;