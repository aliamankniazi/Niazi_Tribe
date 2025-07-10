import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { isAdmin } from '../middleware/admin';
import { dbClient } from '../database/client';
import { backupDatabase } from '../utils/backup';
import { clearCache } from '../utils/cache';
import { exportUserData } from '../utils/export';

interface SystemStats {
  users: number;
  trees: number;
  media: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const router = Router();

// Middleware to ensure only admins can access these routes
router.use(isAuthenticated, isAdmin);

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const users = await dbClient.user.findMany();
    const stats: SystemStats = {
      users: users.length,
      trees: 0,
      media: 0
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await dbClient.user.findMany();
    res.json({ success: true, data: users });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'An unknown error occurred' });
    }
  }
});

// Backup database
router.post('/backup', async (req, res) => {
  try {
    await backupDatabase();
    
    await dbClient.systemLog.create({
      data: {
        type: 'BACKUP',
        message: 'System backup created'
      }
    });

    res.json({ message: 'Backup created successfully' });
  } catch (error) {
    console.error('Failed to backup database:', error);
    res.status(500).json({ error: 'Failed to backup database' });
  }
});

// Export user data
router.post('/export', async (req, res) => {
  try {
    const exportPath = await exportUserData();
    
    await dbClient.systemLog.create({
      data: {
        type: 'EXPORT',
        message: 'Data export completed'
      }
    });

    res.json({ 
      message: 'Export completed successfully',
      downloadUrl: `/downloads/${exportPath}`
    });
  } catch (error) {
    console.error('Failed to export user data:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    await clearCache();
    
    await dbClient.systemLog.create({
      data: {
        type: 'CACHE_CLEAR',
        message: 'Cache cleared'
      }
    });

    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const logs: LogEntry[] = [];
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router; 