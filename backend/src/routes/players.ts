import { Router, Request, Response } from 'express';
import { PlayerData, PlayerID } from '@/types';
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
    const {hitters, pitchers} = await getPlayers();
    const playersMap = new Map<PlayerID, PlayerData>();
    for (const player of [...hitters, ...pitchers]) {
      playersMap.set(player.id, player);
    }
    const players = filterByName(Array.from(playersMap.values()));

    return res.json({ players });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const {hitters, pitchers} = await getPlayers();
    const players = [...hitters, ...pitchers];
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
