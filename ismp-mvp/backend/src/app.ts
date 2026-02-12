import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
app.use('/api/v1', routes);
app.use(errorMiddleware);
