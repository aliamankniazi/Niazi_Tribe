import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import PersonService from '../services/PersonService';
import { dbClient } from '../database/client';

const router = Router();

// POST /api/relationships
router.post('/', async (req, res) => {
  try {
    const { type, personId1, personId2 } = req.body;

    if (!type || !personId1 || !personId2) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await dbClient.query(
      'INSERT INTO relationships (type, person1_id, person2_id) VALUES ($1, $2, $3) RETURNING *',
      [type, personId1, personId2]
    );

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Failed to create relationship',
      error: message
    });
  }
});

// DELETE /api/relationships/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbClient.query(
      'DELETE FROM relationships WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
    }

    res.json({
      success: true,
      message: 'Relationship deleted successfully'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Failed to delete relationship',
      error: message
    });
  }
});

router.get('/family/:id', isAuthenticated, async (req, res) => {
  try {
    const family = await PersonService.familyConnections(req.params.id);
    res.json({ success: true, data: family });
  } catch(e) { 
    res.status(500).json({success: false, message: 'Failed', error: e.message}); 
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbClient.query(
      'SELECT * FROM relationships WHERE id = $1',
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch relationship',
      error: message
    });
  }
});

export default router; 