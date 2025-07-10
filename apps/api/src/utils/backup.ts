import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true });

  // Get database connection info from environment variables
  const {
    MYSQL_HOST = 'localhost',
    MYSQL_PORT = '3306',
    MYSQL_USER = 'root',
    MYSQL_PASSWORD = '',
    MYSQL_DATABASE = 'niazitribe'
  } = process.env;

  // Construct mysqldump command
  const command = `mysqldump -h ${MYSQL_HOST} -P ${MYSQL_PORT} -u ${MYSQL_USER} ${MYSQL_PASSWORD ? `-p${MYSQL_PASSWORD}` : ''} ${MYSQL_DATABASE} > ${backupFile}`;

  try {
    await execAsync(command);
    
    // Compress the backup
    await execAsync(`gzip ${backupFile}`);
    
    return `${backupFile}.gz`;
  } catch (error) {
    console.error('Database backup failed:', error);
    throw new Error('Failed to create database backup');
  }
} 