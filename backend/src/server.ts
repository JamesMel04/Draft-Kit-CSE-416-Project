import express, {Request, Response} from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { optionalEnv } from '@/utils/env-reader';

import playersRouter from '@/routes/players';
import compareRouter from '@/routes/compare';
import draftsRouter from '@/routes/drafts';
import evaluationRouter from '@/routes/evaluation';

dotenv.config();

const app = express();
const PORT = optionalEnv('PORT', '4000');
const PUBLIC_DIR = path.join(__dirname, '../public');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.use('/players', playersRouter);
app.use('/compare', compareRouter);
app.use('/drafts', draftsRouter);
app.use('/evaluation', evaluationRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
