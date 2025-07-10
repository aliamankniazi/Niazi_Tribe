import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation schemas
const createPersonSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  middleName: Joi.string().max(100).optional(),
  gender: Joi.string().valid('male', 'female', 'unknown').required(),
  birthDate: Joi.string().isoDate().optional(),
  birthPlace: Joi.string().max(200).optional(),
  deathDate: Joi.string().isoDate().optional(),
  deathPlace: Joi.string().max(200).optional(),
  biography: Joi.string().max(5000).optional(),
  isLiving: Joi.boolean().default(true),
  privacy: Joi.string().valid('public', 'private', 'family_only').default('public')
});

/**
 * @swagger
 * /api/persons:
 *   get:
 *     summary: Get all persons with pagination
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of persons retrieved successfully
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // TODO: Implement actual database query
    // For now, return mock data
    const mockPersons = [
      {
        id: uuidv4(),
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        birthDate: '1920-05-15',
        birthPlace: 'New York, NY, USA',
        deathDate: '1995-12-03',
        deathPlace: 'Los Angeles, CA, USA',
        isLiving: false,
        privacy: 'public',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        firstName: 'Mary',
        lastName: 'Johnson',
        gender: 'female',
        birthDate: '1925-08-22',
        birthPlace: 'Chicago, IL, USA',
        isLiving: true,
        privacy: 'family_only',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const filteredPersons = search 
      ? mockPersons.filter(p => 
          p.firstName.toLowerCase().includes(search.toLowerCase()) ||
          p.lastName.toLowerCase().includes(search.toLowerCase())
        )
      : mockPersons;

    const total = filteredPersons.length;
    const persons = filteredPersons.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        persons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching persons:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching persons'
    });
  }
});

/**
 * @swagger
 * /api/persons:
 *   post:
 *     summary: Create a new person
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, unknown]
 *               birthDate:
 *                 type: string
 *                 format: date
 *               birthPlace:
 *                 type: string
 *               deathDate:
 *                 type: string
 *                 format: date
 *               deathPlace:
 *                 type: string
 *               biography:
 *                 type: string
 *               isLiving:
 *                 type: boolean
 *               privacy:
 *                 type: string
 *                 enum: [public, private, family_only]
 *     responses:
 *       201:
 *         description: Person created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Validate request body
    const { error, value } = createPersonSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const personData = {
      id: uuidv4(),
      ...value,
      createdBy: req.user!.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // TODO: Save to database
    // await PersonService.create(personData);

    logger.info(`Person created: ${personData.id} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: personData
    });

  } catch (error) {
    logger.error('Error creating person:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating person'
    });
  }
});

/**
 * @swagger
 * /api/persons/{id}:
 *   get:
 *     summary: Get a person by ID
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Person retrieved successfully
 *       404:
 *         description: Person not found
 */
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // TODO: Fetch from database
    // const person = await PersonService.findById(id);
    
    // Mock person data
    const person = {
      id,
      firstName: 'John',
      lastName: 'Smith',
      middleName: 'William',
      gender: 'male',
      birthDate: '1920-05-15',
      birthPlace: 'New York, NY, USA',
      deathDate: '1995-12-03',
      deathPlace: 'Los Angeles, CA, USA',
      biography: 'John was a carpenter who immigrated from Ireland in 1918...',
      isLiving: false,
      privacy: 'public',
      lifeEvents: [
        {
          id: uuidv4(),
          type: 'birth',
          date: '1920-05-15',
          place: 'New York, NY, USA'
        },
        {
          id: uuidv4(),
          type: 'marriage',
          date: '1945-06-20',
          place: 'Brooklyn, NY, USA'
        }
      ],
      relationships: [
        {
          id: uuidv4(),
          type: 'spouse',
          personId: uuidv4(),
          personName: 'Mary Johnson Smith',
          startDate: '1945-06-20'
        }
      ],
      media: [],
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }

    res.json({
      success: true,
      data: person
    });

  } catch (error) {
    logger.error('Error fetching person:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching person'
    });
  }
});

/**
 * @swagger
 * /api/persons/{id}:
 *   put:
 *     summary: Update a person
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               biography:
 *                 type: string
 *     responses:
 *       200:
 *         description: Person updated successfully
 *       404:
 *         description: Person not found
 */
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Validate permissions and update in database
    // const person = await PersonService.update(id, req.body, req.user!.id);

    const updatedPerson = {
      id,
      ...req.body,
      updatedAt: new Date()
    };

    logger.info(`Person updated: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Person updated successfully',
      data: updatedPerson
    });

  } catch (error) {
    logger.error('Error updating person:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating person'
    });
  }
});

/**
 * @swagger
 * /api/persons/{id}/tree:
 *   get:
 *     summary: Get family tree for a person
 *     tags: [Persons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: generations
 *         schema:
 *           type: integer
 *           default: 3
 *     responses:
 *       200:
 *         description: Family tree retrieved successfully
 */
router.get('/:id/tree', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const generations = parseInt(req.query.generations as string) || 3;

    // TODO: Build family tree from database
    // const tree = await PersonService.buildFamilyTree(id, generations);

    // Mock tree data
    const tree = {
      rootPerson: {
        id,
        firstName: 'John',
        lastName: 'Smith',
        birthDate: '1920-05-15',
        deathDate: '1995-12-03',
        gender: 'male'
      },
      ancestors: [
        {
          id: uuidv4(),
          firstName: 'Robert',
          lastName: 'Smith',
          birthDate: '1890-03-10',
          deathDate: '1970-11-15',
          gender: 'male',
          relationship: 'father'
        },
        {
          id: uuidv4(),
          firstName: 'Margaret',
          lastName: 'O\'Brien',
          birthDate: '1895-07-22',
          deathDate: '1975-04-08',
          gender: 'female',
          relationship: 'mother'
        }
      ],
      descendants: [
        {
          id: uuidv4(),
          firstName: 'James',
          lastName: 'Smith',
          birthDate: '1946-02-14',
          gender: 'male',
          relationship: 'son'
        }
      ],
      spouses: [
        {
          id: uuidv4(),
          firstName: 'Mary',
          lastName: 'Johnson',
          birthDate: '1925-08-22',
          gender: 'female',
          relationship: 'spouse',
          marriageDate: '1945-06-20'
        }
      ]
    };

    res.json({
      success: true,
      data: tree
    });

  } catch (error) {
    logger.error('Error building family tree:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while building family tree'
    });
  }
});

export default router; 