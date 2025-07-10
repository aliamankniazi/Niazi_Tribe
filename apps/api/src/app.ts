import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import treeRoutes from './routes/tree';
import mediaRoutes from './routes/media';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/error';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Static files
app.use('/downloads', express.static('exports'));
app.use('/backups', express.static('backups'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

export default app; 