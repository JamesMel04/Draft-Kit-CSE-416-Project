import { Router, Request, Response } from "express";
import axios from 'axios';
import { PlayerData } from "../types";
import { testPlayerDataSet } from "../data/test-data";

const router = Router();
const API_URL = process.env.API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

router.get('/', async (req: Request, res: Response) => {
  const { name } = req.query;
  try {
    const { data }: { data: PlayerData[] } = await api.get('/players');
    const searchResults = data.filter(p => p.name.includes(String(name || '')));
    res.json({ players: searchResults });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to search for players' });
  }
});

export default router;