import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<User[]>('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async create(user: { name: string; email: string; password: string }): Promise<number> {
    const [result] = await pool.query('INSERT INTO users SET ?', user);
    return (result as any).insertId;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query<User[]>('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }
}

export default UserModel;