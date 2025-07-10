import { getMySQLPool } from './connection';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export const initializeDatabase = async () => {
  try {
    const pool = getMySQLPool();
    
    if (!pool) {
      logger.warn('MySQL pool not available, skipping database initialization');
      return;
    }

    // Read the initialization SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');

    // MySQL2 supports multiple statements, so we can execute the entire file at once
    try {
      // Enable multiple statements for this query
      const connection = await pool.getConnection();
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query(sqlContent);
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      connection.release();
    } catch (error: any) {
      // If bulk execution fails, try statement by statement
      logger.warn('Bulk SQL execution failed, trying statement by statement');
      
      // Split by semicolon but be careful with statements containing semicolons in strings
      const statements = sqlContent
        .split(/;\s*$/gm) // Split on semicolons at end of lines
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0 && !statement.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await pool.execute(statement);
        } catch (error: any) {
          // Ignore errors for duplicate entries or existing tables
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry') &&
              !error.message.includes('ER_DUP_ENTRY')) {
            logger.error(`Error executing statement ${i + 1}: ${error.message}`);
            logger.error(`Statement: ${statement.substring(0, 100)}...`);
            throw error;
          }
        }
      }
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
};

// Helper function to check if database is initialized
export const isDatabaseInitialized = async (): Promise<boolean> => {
  try {
    const pool = getMySQLPool();
    if (!pool) return false;

    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      ['users']
    );

    return (rows as any)[0].count > 0;
  } catch (error) {
    logger.error('Error checking database initialization:', error);
    return false;
  }
};