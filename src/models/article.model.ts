import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

interface Article extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  featured_image: Buffer | null;
  image_mime_type: string | null;
  author_id: number;
  created_at: Date;
  updated_at: Date;
}

class ArticleModel {
  static async findAll(): Promise<Article[]> {
    const [rows] = await pool.query<Article[]>('SELECT * FROM articles');
    return rows;
  }

  static async findById(id: number): Promise<Article | null> {
    const [rows] = await pool.query<Article[]>('SELECT * FROM articles WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.query('INSERT INTO articles SET ?', article);
    return (result as any).insertId;
  }

  static async update(id: number, article: Partial<Article>): Promise<boolean> {
    const [result] = await pool.query('UPDATE articles SET ? WHERE id = ?', [article, id]);
    return (result as any).affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query('DELETE FROM articles WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  static async findByAuthor(authorId: number): Promise<Article[]> {
    const [rows] = await pool.query<Article[]>('SELECT * FROM articles WHERE author_id = ?', [authorId]);
    return rows;
  }
}

export default ArticleModel;