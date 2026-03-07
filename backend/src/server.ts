import express, {Request, Response} from 'express';
import cors from "cors"
import dotenv from 'dotenv';

import searchRouter from './routes/search';
import playersRouter from './routes/players';
import compareRouter from './routes/compare';
import draftRouter from './routes/draft';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.use('/search', searchRouter);
app.use('/players', playersRouter);
app.use('/compare', compareRouter);
app.use('/draft', draftRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
