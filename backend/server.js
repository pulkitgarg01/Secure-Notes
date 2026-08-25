import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { validateEnv } from './config/env.js';
import { startDeadlineCron } from './services/DeadlineService.js';

validateEnv();

const [
  { default: authRoutes },
  { default: adminRoutes },
  { default: academicRoutes },
  { default: teacherRoutes },
  { default: studentRoutes },
  { default: communicationRoutes },
] = await Promise.all([
  import('./routes/auth.js'),
  import('./routes/admin.js'),
  import('./routes/academic.js'),
  import('./routes/teacher.js'),
  import('./routes/student.js'),
  import('./routes/communication.js'),
]);

const app = express();
const PORT = process.env.PORT || 4000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/acadence';
mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  startDeadlineCron();
}).catch((err) => {
  console.error('MongoDB connection error', err);
  process.exit(1);
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' } // Anti-embedding
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin, credentials: true }));

const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 10000, 
  message: { error: 'Too many requests from this IP, please try again later.' } 
});
const uploadLimiter = rateLimit({ 
  windowMs: 60 * 1000, 
  max: 100,
  message: { error: 'Too many upload attempts, please try again later.' }
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/communication', communicationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



