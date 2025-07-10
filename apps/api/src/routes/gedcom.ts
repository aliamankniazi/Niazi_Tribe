import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/gedcom/import
router.post('/import', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement GEDCOM import
    res.json({
      success: true,
      message: 'GEDCOM import started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error importing GEDCOM'
    });
  }
});

// GET /api/gedcom/export
router.get('/export', authMiddleware, async (req, res) => {
  try {
    // TODO: Implement GEDCOM export
    res.json({
      success: true,
      message: 'GEDCOM export started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting GEDCOM'
    });
  }
});

export default router; 