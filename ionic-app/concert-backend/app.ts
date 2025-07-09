import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './src/config/db';
import userRoutes from './src/routes/userRoutes';
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
app.use('/assets', express.static(path.join(__dirname, 'assets')));
const port = process.env['PORT'] || 3000;
app.use('/uploads', express.static('uploads'));
app.use(express.json());
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

app.use('/api/users', userRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the User Management API!');
});
app.use(express.json({ limit: '10mb' })); // or '10mb' if needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
