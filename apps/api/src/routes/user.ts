import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    // TODO: Implement profile update logic
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router; 