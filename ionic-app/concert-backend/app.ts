import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';

import db from './src/config/db';
import userRoutes from './src/routes/userRoutes';
import preferencesRoutes from './src/routes/preferencesRoutes';
import eventStatisticRoutes from './src/routes/eventStatisticsRoutes';
import concertRoutes from './src/routes/concertRoutes';
import notificationRoutes from './src/routes/notificationRoutes';
import searchRoutes from './src/routes/searchRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(
  '/profile-pictures',
  express.static(path.join(__dirname, 'assets/profile-pictures'))
);
app.use('/uploads', express.static('uploads'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

db.getConnection()
  .then((connection) => {
    console.log('Successfully connected to MySQL database!');
    connection.release();
  })
  .catch((err: Error) => {
    console.error('Error connecting to MySQL database:', err.message);
    process.exit(1);
  });

app.get('/', (_req: Request, res: Response) => {
  res.send('Welcome to the User Management API!');
});

app.use('/api/preferences', preferencesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/event-statistics', eventStatisticRoutes);
app.use('/api/concerts', concertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search-history', searchRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message });
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
