import { Router, Request, Response } from 'express';
import { testPlayerDataSet } from '@/data/test-data';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { playerId1, playerId2 } = req.query;
  try {
    const playerData1 = testPlayerDataSet.find(p => p.id === playerId1); // Get player data for playerId1 from API
    const playerData2 = testPlayerDataSet.find(p => p.id === playerId2); // Get player data for playerId2 from API
    const comparison = {}; // Get comparison data from API based on playerId1 and playerId2
    res.json({ player1: playerData1, player2: playerData2, comparison });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

export default router;