import express, { Application } from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import githubRoutes from './routes/githubRoutes';
import cors from 'cors';

dotenv.config();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:4200'];

const PORT = process.env['PORT'] || 3000;
const MONGO_URI = process.env['MONGO_URI'] as string;

const app: Application = express();

const options: cors.CorsOptions = {
    origin: allowedOrigins
}

app.use(express.json());
app.use(cors(options));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/github', githubRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));