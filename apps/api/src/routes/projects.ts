import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement project listing
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
});

// POST /api/projects
router.post('/', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement project creation
    res.json({
      success: true,
      message: 'Project created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
});

export default router; 