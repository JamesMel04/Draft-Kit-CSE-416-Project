import { Router, Request, Response } from "express";
import axios from 'axios';
import { PlayerData, UpstreamPlayersPayload } from "../types";
import { parseBoolean, parsePositiveInt, parseSortString } from "../utils/parsers";
import { isValidSortField, sortPlayers } from "../utils/sorters";
import { buildPagination, normalizeUpstreamPlayers } from "../utils/pagination";

const router = Router();
const API_URL = process.env.API_URL || 'https://api-cse-416-project.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

router.get('/', async (req: Request, res: Response) => {
  const requestedSort = parseSortString(req.query.sort, 'name');
  const asc = parseBoolean(req.query.asc, true);
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 25), 100);

  try {
    const { data } = await api.get<UpstreamPlayersPayload>('/players', {
      params: { sort: requestedSort, asc, page, limit }
    });

    const upstream = normalizeUpstreamPlayers(data);
    const sort = isValidSortField(requestedSort, upstream.players)? requestedSort : 'name';

    if (upstream.isPaginated) {
      const pagination = buildPagination(
        upstream.pagination?.total ?? upstream.players.length,
        upstream.pagination?.page ?? page,
        upstream.pagination?.limit ?? limit
      );

      return res.json({
        players: upstream.players,
        pagination,
        sorting: { sort, asc }
      });
    }

    const sortedPlayers = sortPlayers(upstream.players, sort, asc);
    const pagination = buildPagination(sortedPlayers.length, page, limit);
    const start = (pagination.page - 1) * pagination.limit;
    const paginatedPlayers = sortedPlayers.slice(start, start + pagination.limit);

    return res.json({
      players: paginatedPlayers,
      pagination,
      sorting: { sort, asc }
    });
  } catch (error) {
    try {
      const { data } = await api.get<PlayerData[]>('/players');
      const sort = isValidSortField(requestedSort, data)? requestedSort : 'name';
      const sortedPlayers = sortPlayers(data, sort, asc);
      const pagination = buildPagination(sortedPlayers.length, page, limit);
      const start = (pagination.page - 1) * pagination.limit;
      const paginatedPlayers = sortedPlayers.slice(start, start + pagination.limit);

      return res.json({
        players: paginatedPlayers,
        pagination,
        sorting: { sort, asc },
        fallback: true
      });
    } catch (fallbackError) {
      console.error('API Error:', fallbackError);
      return res.status(500).json({ error: 'Failed to fetch player data' });
    }
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