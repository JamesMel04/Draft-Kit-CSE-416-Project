import { Router, Request, Response } from 'express';
import { PlayerData } from '@/types';
import { getPlayers } from '@/utils/api';
import { parseStringQuery } from '@/utils/parsers';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const name = parseStringQuery(req.query.name, '');

  const filterByName = (players: PlayerData[]) => {
    if (!name) {
      return players;
    }

    const lowerName = name.toLowerCase();
    return players.filter((player) => player.name.toLowerCase().includes(lowerName));
  };

  try {
    const players = filterByName(await getPlayers());
    return res.json({ players });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const players = await getPlayers();
    const playerData = players.find(p => p.id === id);
    res.json({ player: playerData });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id/notes', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const notes = "Notes"; // Get notes from database based on id
    res.json({ notes });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/:id/notes', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    // Save notes to database based on id
    res.json({ notes: { id, content }, status: 'saved' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

export default router;
