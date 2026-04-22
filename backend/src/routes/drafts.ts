import { Router, Request, Response } from 'express';
import { testDraftDataSet } from '@/data/test-data';
import { randomUUID } from 'crypto';
import { DraftData } from '@/types';
import { parseStringQuery, parseRoster } from '@/utils/parsers';

const router = Router();

router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userId = userIdHeader || 'anonymous-user';

    const drafts = testDraftDataSet.filter(d => d.userId === userId);
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

    const draft = testDraftDataSet.filter(d => d.userId === userId).find(d => d.id === id); // Placeholder for actual API call
    res.json({ draft });
  } catch (error) {
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
    const roster = parseRoster(req.body.roster);

    if (id) {
      // Update existing draft
      const draft = testDraftDataSet.filter(d => d.userId === userId).find(d => d.id === id);
      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      draft.teamName = teamName ?? '';
      draft.roster = roster ?? {};
      res.json({ status: 'updated', draft });
    } else {
      // Create new draft
      const draft: DraftData = { userId, id: randomUUID(), teamName: teamName, roster: roster ?? {} };
      testDraftDataSet.push(draft); // Add to test data set for retrieval
      res.json({ status: 'created', draft });
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
    const draft = testDraftDataSet.filter(d => d.userId === userId).find(d => d.id === id); // Placeholder for actual API call
    res.json({ player: { id: playerId, position }, draft, status: 'added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add player to draft' });
  }
});

export default router;