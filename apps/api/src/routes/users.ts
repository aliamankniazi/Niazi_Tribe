import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMySQLPool } from '../database/connection';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const pool = getMySQLPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database not available' });
    }

    const [rows] = await pool.query('SELECT id, email, username, first_name AS firstName, last_name AS lastName, profile_picture AS profilePicture, bio FROM users WHERE id = ?', [(req as any).user.id]);

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user: (rows as any)[0] } });
  } catch (error: any) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile'
    });
  }
});

// PUT /api/users/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const pool = getMySQLPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database not available' });

    const { firstName, lastName, bio, profilePicture } = req.body;

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, bio = ?, profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [firstName, lastName, bio, profilePicture, (req as any).user.id]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

export default router; 