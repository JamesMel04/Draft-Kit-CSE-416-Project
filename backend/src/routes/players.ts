import { Router, Request, Response } from "express";
import { testPlayerDataSet } from '../data/test-data';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all players data from API
    const players = testPlayerDataSet; // Placeholder for actual API call
    res.json({ players });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Get player data from API based on id
    const playerData = testPlayerDataSet.find(p => p.id === id); // Placeholder for actual API call
    res.json({ player: playerData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id/notes', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const notes = "Notes"; // Get notes from database based on id
    res.json({ notes });
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

export default router;