import { Router, Request, Response } from "express";
import axios from 'axios';
import { PlayerData } from "../types";
import { parseBoolean, parseSortString } from "../utils/parsers";
import { isValidSortField, sortPlayers } from "../utils/sorters";

const router = Router();
const API_URL = process.env.API_URL || 'https://api-cse-416-project.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

router.get('/', async (req: Request, res: Response) => {
  const { name } = req.query;
  const requestedSort = parseSortString(req.query.sort, 'name');
  const asc = parseBoolean(req.query.asc, true);

  try {
    const { data }: { data: PlayerData[] } = await api.get('/players');
    const searchResults = data.filter(p => p.name.includes(String(name || '')));
    const sort = isValidSortField(requestedSort, searchResults)? requestedSort : 'name';
    const sortedResults = sortPlayers(searchResults, sort, asc);
    res.json({ players: sortedResults, sorting: { sort, asc } });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to search for players' });
  }
});

export default router;