import { getMySQLPool } from '../database/connection';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export class UserService {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const pool = getMySQLPool();
      if (!pool) {
        logger.error('MySQL pool not available');
        return null;
      }

      const [rows] = await pool.query<any[]>(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as User;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      const pool = getMySQLPool();
      if (!pool) {
        logger.error('MySQL pool not available');
        return null;
      }

      const [rows] = await pool.query<any[]>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as User;
    } catch (error) {
      logger.error('Error finding user by id:', error);
      return null;
    }
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  static async create(userData: {
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }): Promise<User | null> {
    try {
      const pool = getMySQLPool();
      if (!pool) {
        logger.error('MySQL pool not available');
        return null;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);

      const [result] = await pool.query<any>(
        `INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, is_verified) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.email,
          userData.username,
          passwordHash,
          userData.first_name,
          userData.last_name,
          userData.role || 'user',
          true,
          false
        ]
      );

      return this.findById(result.insertId);
    } catch (error) {
      logger.error('Error creating user:', error);
      return null;
    }
  }

  static async verifyEmail(userId: number): Promise<boolean> {
    try {
      const pool = getMySQLPool();
      if (!pool) {
        logger.error('MySQL pool not available');
        return false;
      }

      await pool.query(
        'UPDATE users SET is_verified = ? WHERE id = ?',
        [true, userId]
      );

      return true;
    } catch (error) {
      logger.error('Error verifying email:', error);
      return false;
    }
  }
}

export default UserService; 