import { Router, Request, Response } from "express";
import axios from 'axios';
import { testPlayerDataSet } from '../data/test-data';
import { PlayerData } from "../types";

const router = Router();
const API_URL = process.env.API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { data }: { data: PlayerData[] } = await api.get('/players');
    res.json({ players: data });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data }: { data: PlayerData[] } = await api.get('/players');
    const playerData = data.find(p => p.id === id);
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