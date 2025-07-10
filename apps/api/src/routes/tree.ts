import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Get tree data
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const treeId = parseInt(req.params.id, 10);
    // TODO: Implement tree fetching
    res.json({ id: treeId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tree' });
  }
});

export default router; 