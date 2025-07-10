import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';
import { config } from '../config';

let neo4jDriver: any;
let mysqlPool: mysql.Pool;

export const connectDatabase = async () => {
  try {
    // Connect to Neo4j (optional)
    if (config.NEO4J_URI && config.NEO4J_URI.trim() !== '') {
      try {
        // Dynamically import neo4j-driver only when needed
        const neo4j = await import('neo4j-driver');
        neo4jDriver = neo4j.default.driver(
          config.NEO4J_URI,
          neo4j.default.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD)
        );
        
        // Verify connection
        await neo4jDriver.verifyConnectivity();
        logger.info('Connected to Neo4j database');
      } catch (neo4jError: any) {
        logger.warn('Neo4j connection failed, continuing with MySQL only:', neo4jError.message);
        neo4jDriver = null;
      }
    } else {
      logger.info('Neo4j URI not configured, using MySQL only');
    }

    // Connect to MySQL
    if (config.MYSQL_HOST) {
      mysqlPool = mysql.createPool({
        host: config.MYSQL_HOST,
        port: config.MYSQL_PORT,
        database: config.MYSQL_DATABASE,
        user: config.MYSQL_USER,
        password: config.MYSQL_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
      
      // Verify connection
      const connection = await mysqlPool.getConnection();
      await connection.ping();
      connection.release();
      logger.info('Connected to MySQL database');
    } else {
      logger.warn('MySQL host not configured, skipping connection');
    }

    return { neo4jDriver, mysqlPool };
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

export const getNeo4jDriver = () => neo4jDriver;
export const getMySQLPool = () => mysqlPool;

export const closeDatabaseConnections = async () => {
  try {
    if (neo4jDriver) {
      await neo4jDriver.close();
      logger.info('Neo4j connection closed');
    }
    
    if (mysqlPool) {
      await mysqlPool.end();
      logger.info('MySQL connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
}; 