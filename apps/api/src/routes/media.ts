import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/media/upload
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement media upload
    res.json({
      success: true,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading media'
    });
  }
});

export default router;