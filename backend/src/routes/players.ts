import { Router, Request, Response } from 'express';
import { HitterPlayer, PitcherPlayer, Player, PlayerData, PlayerID, PlayerPools } from '@/types';
import { getPlayers } from '@/utils/api';
import { parseStringQuery } from '@/utils/parsers';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const name = parseStringQuery(req.query.name, '');

  const filterByName = (players: Player[]) => {
    if (!name) {
      return players;
    }

    const lowerName = name.toLowerCase();
    return players.filter((player) => player.name.toLowerCase().includes(lowerName));
  };

  try {
    const {hitters, pitchers} = await getPlayers();

    // Two maps for hitters and pitchers
    const hittersMap = new Map<PlayerID, Player>();
    const pitchersMap = new Map<PlayerID, Player>();
    // Create two mappings
    for (const player of hitters) {
      hittersMap.set(player.id, player);
    }
    for(const player of pitchers) {
      pitchersMap.set(player.id, player);
    }
    const hitterPlayers = filterByName(Array.from(hittersMap.values()));
    const pitcherPlayers = filterByName(Array.from(pitchersMap.values()));
    return res.json({ hitters: hitterPlayers, pitchers: pitcherPlayers });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
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
  try {
    const id = Number(req.params.id);
    const notes = "Notes"; // Get notes from database based on id
    res.json({ notes });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;
    // Save notes to database based on id
    res.json({ notes: { id, content }, status: 'saved' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

export default router;
