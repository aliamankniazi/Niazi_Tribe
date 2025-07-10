import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMySQLPool } from '../database/connection';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const pool = getMySQLPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not available' });

    const results: Record<string, number> = {
      people: 0,
      media: 0,
      dnaMatches: 0,
      recentActivity: 0,
    };

    // persons count (optional table)
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM persons');
      results.people = (rows as any)[0].cnt;
    } catch (err) {
      // table might not exist yet
      logger.warn('Persons table not found while counting', err);
    }

    // media count
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM media');
      results.media = (rows as any)[0].cnt;
    } catch (err) {}

    // dna matches (placeholder)
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM dna_matches');
      results.dnaMatches = (rows as any)[0].cnt;
    } catch (err) {}

    // recent activity in last 30 days
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
      results.recentActivity = (rows as any)[0].cnt;
    } catch (err) {}

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

export default router; 