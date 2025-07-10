import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 5000;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'gedcom-service.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'GEDCOM Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GEDCOM processing endpoints
app.post('/api/gedcom/parse', (req, res) => {
  // TODO: Implement GEDCOM parsing logic
  res.json({
    success: true,
    message: 'GEDCOM parsing endpoint - implementation pending',
    data: null
  });
});

app.post('/api/gedcom/import', (req, res) => {
  // TODO: Implement GEDCOM import logic
  res.json({
    success: true,
    message: 'GEDCOM import endpoint - implementation pending',
    data: null
  });
});

app.get('/api/gedcom/status/:jobId', (req, res) => {
  // TODO: Implement job status checking
  res.json({
    success: true,
    message: 'GEDCOM job status endpoint - implementation pending',
    data: { jobId: req.params.jobId, status: 'pending' }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`GEDCOM Service started on port ${PORT}`);
  console.log(`🚀 GEDCOM Service running on http://localhost:${PORT}`);
});

export default app; 