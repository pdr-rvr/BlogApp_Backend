import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  profile_picture_data: Buffer | null;
  profile_picture_mime_type: string | null;
  profilePictureBase64?: string;
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

  static async findByIdWithProfileImage(id: number): Promise<User | null> {
    const [rows] = await pool.query<User[]>(
      'SELECT id, name, email, TO_BASE64(profile_picture_data) as profilePictureBase64, profile_picture_mime_type, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query<User[]>('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async updatePasswordByEmail(email: string, hashedPassword: string): Promise<boolean> {
    const [result] = await pool.execute<any>(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [hashedPassword, email]
    );
    return result.affectedRows > 0;
  }

  static async updateProfile(id: number, data: { name?: string; email?: string;}): Promise<boolean> {
    const [result] = await pool.query('UPDATE users SET ? WHERE id = ?', [data, id]);
    return (result as any).affectedRows > 0;
  }

  static async updateProfilePicture(id: number, imageData: Buffer, imageMimeType: string): Promise<boolean> {
    const [result] = await pool.query(
      'UPDATE users SET profile_picture_data = ?, profile_picture_mime_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [imageData, imageMimeType, id]
    );
    return (result as any).affectedRows > 0;
  }
}

export default UserModel;