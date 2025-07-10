import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000'),
  
  // CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [],
  
  // Database
  // MySQL Configuration
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: parseInt(process.env.MYSQL_PORT || '3306'),
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'niazi_tribe',
  MYSQL_USER: process.env.MYSQL_USER || 'root',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
  
  // Neo4j Configuration
  NEO4J_URI: process.env.NEO4J_URI || '',
  NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || '',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || '',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'localhost',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@niazitribe.com',
  
  // AWS S3
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || 'niazi-tribe-media',
  
  // File uploads
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/mpeg',
    'application/pdf',
    'text/plain'
  ],
  
  // External APIs
  FAMILYSEARCH_API_KEY: process.env.FAMILYSEARCH_API_KEY || '',
  MYHERITAGE_API_KEY: process.env.MYHERITAGE_API_KEY || '',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100'),
  
  // Background jobs
  JOB_QUEUE_REDIS_URL: process.env.JOB_QUEUE_REDIS_URL || process.env.REDIS_URL || '',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  
  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  
  // Client URLs
  CLIENT_URL: process.env.CLIENT_URL || '',
  API_BASE_URL: process.env.API_BASE_URL || '',
  
  // Feature flags
  ENABLE_GRAPHQL: process.env.ENABLE_GRAPHQL !== 'false',
  ENABLE_DNA_FEATURES: process.env.ENABLE_DNA_FEATURES !== 'false',
  ENABLE_MATCHING: process.env.ENABLE_MATCHING !== 'false'
}; 