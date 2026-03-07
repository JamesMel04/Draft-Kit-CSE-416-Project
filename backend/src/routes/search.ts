import { Router, Request, Response } from "express";

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const { name } = req.query;
  try {
    // Search for players based on name using API
    const players = [{ id: 'player1', name: 'PlayerName 1' }]; // Example search result
    res.json({ players: players });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search for players' });
  }
});

export default router;