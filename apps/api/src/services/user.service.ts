import { getMySQLPool } from '../database/connection';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  bio?: string;
  date_of_birth?: Date;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  role: 'user' | 'admin' | 'moderator';
  created_at: Date;
  updated_at: Date;
}

export class UserService {
  static async createUser(userData: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) {
    const pool = getMySQLPool();
    if (!pool) throw new Error('Database connection not available');

    try {
      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 12);

      // Insert user
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO users (email, username, password_hash, first_name, last_name) 
         VALUES (?, ?, ?, ?, ?)`,
        [userData.email, userData.username, password_hash, userData.first_name, userData.last_name]
      );

      return {
        id: result.insertId,
        email: userData.email,
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name
      };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email or username already exists');
      }
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async findUserByEmail(email: string) {
    const pool = getMySQLPool();
    if (!pool) throw new Error('Database connection not available');

    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    return rows[0] || null;
  }

  static async findUserById(id: number) {
    const pool = getMySQLPool();
    if (!pool) throw new Error('Database connection not available');

    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    return rows[0] || null;
  }

  static async updateUser(id: number, updates: Partial<User>) {
    const pool = getMySQLPool();
    if (!pool) throw new Error('Database connection not available');

    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) return null;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await pool.execute(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return this.findUserById(id);
  }

  static async deleteUser(id: number) {
    const pool = getMySQLPool();
    if (!pool) throw new Error('Database connection not available');

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }

  static async verifyPassword(user: User, password: string) {
    return bcrypt.compare(password, user.password_hash);
  }

  static async listUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}) {
    const pool = getMySQLPool();
    if (!pool) throw new Error('Database connection not available');

    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, username, first_name, last_name, role, is_active, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (options.search) {
      query += ' AND (email LIKE ? OR username LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (options.role) {
      query += ' AND role = ?';
      params.push(options.role);
    }

    // Get total count
    const countQuery = query.replace('SELECT id, email, username, first_name, last_name, role, is_active, created_at', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, params);
    const total = countResult[0].total;

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute<User[]>(query, params);

    return {
      users: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
} 