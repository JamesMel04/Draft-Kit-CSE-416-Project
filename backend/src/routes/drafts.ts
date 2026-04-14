import { Router, Request, Response } from 'express';
import { testDraftDataSet } from '@data/test-data';

const router = Router();

router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userIdHeader = req.header('x-user-id');
    const userIdQuery = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const userId = userIdHeader || userIdQuery || 'anonymous-user';

    const drafts = testDraftDataSet.slice(0, 5).map((draft, index) => ({
      draftId: draft.id,
      name: `Saved Draft ${index + 1}`,
      userId,
      updatedAt: new Date(Date.now() - index * 3600 * 1000).toISOString(),
    }));

    res.json({ drafts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved drafts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const draftData = testDraftDataSet.find(d => d.id === id); // Placeholder for actual API call
    res.json({ draft: draftData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch draft data' });
  }
});

router.post('/:id/player', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { playerId, position } = req.body || {};
  if (!playerId || !position) {
    return res.status(400).json({ error: 'playerId and position required in body' });
  }
  try {
    // Add player to draft based on id, player_id, and position
    const draftData = testDraftDataSet.find(d => d.id === id); // Placeholder for actual API call
    res.json({ player: { id: playerId, position }, draft: draftData, status: 'added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add player to draft' });
  }
});

export default router;