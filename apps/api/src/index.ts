import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from 'apollo-server-express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import personRoutes from './routes/persons';
import relationshipRoutes from './routes/relationships';
import mediaRoutes from './routes/media';
import gedcomRoutes from './routes/gedcom';
import dnaRoutes from './routes/dna';
import projectRoutes from './routes/projects';
import searchRoutes from './routes/search';
import dashboardRoutes from './routes/dashboard';
import treeRoutes from './routes/tree';

// GraphQL
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';

// Database
import { connectDatabase } from './database/connection';
import { initializeDatabase, isDatabaseInitialized } from './database/init';

async function startServer() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.CORS_ORIGINS,
    credentials: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);

  // Logging
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/persons', authMiddleware, personRoutes);
  app.use('/api/relationships', authMiddleware, relationshipRoutes);
  app.use('/api/media', authMiddleware, mediaRoutes);
  app.use('/api/gedcom', authMiddleware, gedcomRoutes);
  app.use('/api/dna', authMiddleware, dnaRoutes);
  app.use('/api/projects', authMiddleware, projectRoutes);
  app.use('/api/search', authMiddleware, searchRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/tree', authMiddleware, treeRoutes);

  // GraphQL Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ user: (req as any).user }),
    introspection: config.NODE_ENV !== 'production'
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app: app as any, path: '/graphql' });

  // Swagger Documentation
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Niazi Tribe API',
        version: '1.0.0',
        description: 'REST API for the collaborative genealogy platform'
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts']
  };

  const specs = swaggerJsdoc(swaggerOptions);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

  // Error handling
  app.use(errorHandler);

  // Connect to database
  await connectDatabase();
  
  // Initialize database schema if needed
  const isInitialized = await isDatabaseInitialized();
  if (!isInitialized) {
    logger.info('Database not initialized, running initialization...');
    await initializeDatabase();
  }

  // Start server
  const server = app.listen(config.PORT, () => {
    logger.info(`🚀 Server running on port ${config.PORT}`);
    logger.info(`📚 API Documentation: http://localhost:${config.PORT}/docs`);
    logger.info(`🔍 GraphQL Playground: http://localhost:${config.PORT}/graphql`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
}

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
}); 