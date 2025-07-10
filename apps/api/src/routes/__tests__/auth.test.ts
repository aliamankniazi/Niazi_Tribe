import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRoutes from '../auth';
import { createMockUser, createMockJWT } from '../../test/setup';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockHashedPassword = 'hashed-password';
      const mockUser = createMockUser();
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        username: 'johndoe',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123'
        // Missing firstName, lastName, username
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      const mockTokens = {
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockTokens.token)
        .mockReturnValueOnce(mockTokens.refreshToken);

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', expect.any(String));
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = createMockUser();
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockPayload = createMockJWT();
      const newToken = 'new-jwt-token';

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwt.sign as jest.Mock).mockReturnValue(newToken);

      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe(newToken);
      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(String));
    });

    it('should return 401 for invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email successfully', async () => {
      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        type: 'email-verification'
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const verificationData = {
        token: 'valid-verification-token'
      };

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verificationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
    });

    it('should return 400 for invalid verification token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const verificationData = {
        token: 'invalid-verification-token'
      };

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send(verificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired verification token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const mockUser = createMockUser();

      const forgotPasswordData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotPasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent');
    });

    it('should return success even for non-existent email (security)', async () => {
      const forgotPasswordData = {
        email: 'nonexistent@example.com'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotPasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent');
    });

    it('should return 400 for invalid email format', async () => {
      const forgotPasswordData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send(forgotPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      const mockPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        type: 'password-reset'
      };
      const hashedPassword = 'new-hashed-password';

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const resetPasswordData = {
        token: 'valid-reset-token',
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetPasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
    });

    it('should return 400 for invalid reset token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const resetPasswordData = {
        token: 'invalid-reset-token',
        password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for weak new password', async () => {
      const resetPasswordData = {
        token: 'valid-reset-token',
        password: '123' // Too weak
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login endpoint', async () => {
      // Make multiple requests quickly
      const promises = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'password' })
      );

      const responses = await Promise.all(promises);
      
      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
    });
  });

  describe('Input Validation', () => {
    it('should sanitize input to prevent XSS', async () => {
      const maliciousData = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Doe',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData);

      // Should either reject or sanitize the input
      if (response.status === 201) {
        expect(response.body.data?.user?.firstName).not.toContain('<script>');
      } else {
        expect(response.status).toBe(400);
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double.dot@domain.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            firstName: 'John',
            lastName: 'Doe',
            email,
            username: 'testuser',
            password: 'password123'
          });

        expect(response.status).toBe(400);
      }
    });
  });
}); 