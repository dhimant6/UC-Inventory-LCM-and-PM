import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { json } from 'express';

import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import teamRoutes from './routes/teams';
import phoneRoutes from './routes/phones';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/phones', phoneRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
