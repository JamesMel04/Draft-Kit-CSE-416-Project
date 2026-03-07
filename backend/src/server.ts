import express, {Request, Response} from 'express';
import cors from "cors"
import dotenv from 'dotenv';

import playersRouter from './routes/players';
import draftRouter from './routes/draft';
import searchRouter from './routes/search';
import compareRouter from './routes/compare';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.use('/players', playersRouter);
app.use('/draft', draftRouter);
app.use('/search', searchRouter);
app.use('/compare', compareRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
