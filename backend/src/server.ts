import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import { test_player_data_set, test_draft_data_set } from './data/test-data';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

/* route to return all players for front-end player view */
app.get('/players', async (req : Request, res : Response) => {
  try {
    // For now, just returns all players in test.data.ts
    const players = test_player_data_set;
    res.json(players);
  }
  catch(error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/search', async (req: Request, res: Response) => {
  const { name } = req.query;
  try {
    // Search for players based on name using API
    const players = [{ id: 'player1', name: 'PlayerName 1' }]; // Example search result
    res.json({ result: players });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search for players' });
  }
});

app.get('/player/:player_id', async (req: Request, res: Response) => {
  const { player_id } = req.params;
  try {
    // Get player data from API based on player_id
    const player_data = test_player_data_set.find(p => p.id === player_id); // Placeholder for actual API call
    res.json({ player_data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

app.get('/player/:player_id/notes', async (req: Request, res: Response) => {
  const { player_id } = req.params;
  try {
    const notes = "Notes"; // Get notes from database based on player_id
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/player/:player_id/notes', async (req: Request, res: Response) => {
  const { player_id } = req.params;
  const { content } = req.body;
  try {
    // Save notes to database based on player_id
    res.json({ content, status: 'saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

app.get('/compare', async (req: Request, res: Response) => {
  const { player1_id, player2_id } = req.query;
  try {
    const player_data1 = test_player_data_set.find(p => p.id === player1_id); // Get player data for player1_id from API
    const player_data2 = test_player_data_set.find(p => p.id === player2_id); // Get player data for player2_id from API
    const comparison = {}; // Get comparison data from API based on player1_id and player2_id
    res.json({ player_data1, player_data2, comparison });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comparison data' });
  }
});

app.get('/draft/:draft_id', async (req: Request, res: Response) => {
  const { draft_id } = req.params;
  try {
    const draft_data = test_draft_data_set.find(d => d.id === draft_id); // Placeholder for actual API call
    res.json({ draft_data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch draft data' });
  }
});

app.post('/draft/:draft_id/player', async (req: Request, res: Response) => {
  const { draft_id } = req.params;
  const { player_id, position } = req.body || {};
  if (!player_id || !position) {
    return res.status(400).json({ error: 'player_id and position required in body' });
  }
  try {
    // Add player to draft based on draft_id, player_id, and position
    const draft_data = test_draft_data_set.find(d => d.id === draft_id); // Placeholder for actual API call
    res.json({ draft_data, status: 'added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add player to draft' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
