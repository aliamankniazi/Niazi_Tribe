import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';

import { config } from '../config';
import { logger } from '../utils/logger';
import { sendEmail } from '../services/email';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import UserService from '../services/UserService';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  username: Joi.string().alphanum().min(3).max(30).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password, firstName, lastName, username } = value;

    // Check if user already exists in database
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user in database
    const newUser = await UserService.create({
      email,
      username,
      password,
      first_name: firstName,
      last_name: lastName,
      role: 'user'
    });

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account'
      });
    }

    // For now, skip email verification and activate the user immediately
    await UserService.verifyEmail(newUser.id);

    logger.info(`User registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. You can now log in.',
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        username: newUser.username
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Email not verified
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Find user in database
    const user = await UserService.findByEmail(email);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await UserService.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      config.JWT_SECRET || 'default-secret',
      { expiresIn: config.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      config.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
      { expiresIn: '30d' } as SignOptions
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          role: user.role
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // TODO: Find user by verification token
    // const user = await UserService.findByVerificationToken(token);
    
    // Mock verification for now
    const user = { id: uuidv4(), email: 'user@example.com' };

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // TODO: Update user email verification status
    // await UserService.verifyEmail(user.id);

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET) as any;
    
    // TODO: Fetch user from database
    // const user = await UserService.findById(decoded.id);
    
    // Mock user for now
    const user = {
      id: decoded.id,
      email: 'user@example.com',
      role: 'standard_user'
    };

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      config.JWT_SECRET || 'default-secret',
      { expiresIn: config.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh'
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    // TODO: Fetch full user profile from database
    // const user = await UserService.findById(req.user!.id);
    
    // Mock user profile for now
    const userProfile = {
      id: req.user!.id,
      email: req.user!.email,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      role: req.user!.role,
      isEmailVerified: true,
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'America/New_York',
        emailNotifications: {
          newMessages: true,
          treeUpdates: true,
          smartMatches: true,
          weeklyDigest: false
        }
      },
      createdAt: new Date()
    };

    res.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile'
    });
  }
});

export default router; 