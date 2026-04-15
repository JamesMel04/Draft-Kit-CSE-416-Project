import { Router, Request, Response } from 'express';
import axios from 'axios';
import { PlayerData } from '@/types';
import { parseBoolean, parsePositiveInt, parseStringQuery } from '@/utils/parsers';
import { isValidSortField, sortPlayers } from '@/utils/sorters';
import { buildPagination } from '@/utils/pagination';

const router = Router();
const API_URL = process.env.API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

router.get('/', async (req: Request, res: Response) => {
  const name = parseStringQuery(req.query.name, '');
  const requestedSort = parseStringQuery(req.query.sort, 'suggestedValue');
  const asc = parseBoolean(req.query.asc, false);
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 25), 100);

  const filterByName = (players: PlayerData[]) => {
    if (!name) {
      return players;
    }

    const lowerName = name.toLowerCase();
    return players.filter((player) => player.name.toLowerCase().includes(lowerName));
  };

  const buildLocalResponse = (players: PlayerData[], fallback = false) => {
    const filteredPlayers = filterByName(players);
    const sort = isValidSortField(requestedSort, filteredPlayers)? requestedSort : 'suggestedValue';
    const sortedPlayers = sortPlayers(filteredPlayers, sort, asc);
    const pagination = buildPagination(sortedPlayers.length, page, limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paginatedPlayers = sortedPlayers.slice(start, start + pagination.limit);

    return {
      players: paginatedPlayers,
      pagination,
      sorting: { sort, asc },
      ...(fallback? { fallback: true } : {})
    };
  };

  try {
    const { data } = await api.get<PlayerData[]>('/players');
    return res.json(buildLocalResponse(data, true));
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch player data' });
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
