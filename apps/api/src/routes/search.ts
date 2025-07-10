import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/search
router.get('/', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement search functionality
    res.json({
      success: true,
      data: {
        results: [],
        total: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error performing search'
    });
  }
});

export default router; 