import { AsyncRequestHandler } from '../types/express';
import { Request, Response, NextFunction } from 'express';
import ArticleModel from '../models/article.model';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { RowDataPacket } from 'mysql2';
import pool from '../config/db';

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir);
      } catch (err: unknown) {
        if (err instanceof Error) {
          return cb(err, '');
        }
        return cb(new Error('Falha ao criar diretório de upload.'), '');
      }
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });

export const getAllArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        a.id, a.title, a.content, TO_BASE64(a.featured_image) as featured_image, a.image_mime_type,
        a.author_id, u.name AS author_name, a.created_at, a.updated_at
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar todos os artigos:', error);
    next(error);
  }
};

export const getArticleById: AsyncRequestHandler = async (req, res, next) => {
  try {
    const articleId = Number(req.params.id);
    const article = await ArticleModel.findById(articleId);
    if (!article) {
      res.status(404).json({ message: 'Artigo não encontrado' });
      return;
    }
    res.json(article);
  } catch (error) {
    next(error);
  }
};

export const createArticle: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      res.status(401).json({ message: 'Não autorizado' });
      return;
    }

    let featuredImage: Buffer | null = null;
    let imageMimeType: string | null = null;

    if (req.file) {
      try {
        featuredImage = fs.readFileSync(req.file.path);
        imageMimeType = req.file.mimetype;
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao deletar arquivo temporário:', unlinkError);
        }
      } catch (fileError) {
        console.error('Erro ao processar arquivo de upload:', fileError);
        next(fileError instanceof Error ? fileError : new Error('Erro ao processar a imagem enviada.'));
        return;
      }
    }

    const articleId = await ArticleModel.create({
      title,
      content,
      featured_image: featuredImage,
      image_mime_type: imageMimeType,
      author_id: authorId
    });
    res.status(201).json({ id: articleId, message: 'Artigo criado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const updateArticle: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const articleId = Number(req.params.id);
    const authorId = req.user?.id;

    if (!authorId) {
      res.status(401).json({ message: 'Não autorizado' });
      return;
    }

    const article = await ArticleModel.findById(articleId);
    if (!article) {
      res.status(404).json({ message: 'Artigo não encontrado' });
      return;
    }
    if (article.author_id !== authorId) {
      res.status(403).json({ message: 'Não autorizado a atualizar este artigo' });
      return;
    }

    let featuredImage = article.featured_image;
    let imageMimeType = article.image_mime_type;

    if (req.file) {
      try {
        featuredImage = fs.readFileSync(req.file.path);
        imageMimeType = req.file.mimetype;
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao deletar arquivo temporário durante atualização:', unlinkError);
        }
      } catch (fileError) {
        console.error('Erro ao processar arquivo de upload durante atualização:', fileError);
        next(fileError instanceof Error ? fileError : new Error('Erro ao processar a imagem enviada durante a atualização.'));
        return;
      }
    }

    const updated = await ArticleModel.update(articleId, {
      title,
      content,
      featured_image: featuredImage,
      image_mime_type: imageMimeType
    });
    if (!updated) {
      res.status(404).json({ message: 'Artigo não encontrado ou nenhuma alteração feita' });
      return;
    }

    res.json({ message: 'Artigo atualizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle: AsyncRequestHandler = async (req, res, next) => {
  try {
    const articleId = Number(req.params.id);
    const authorId = req.user?.id;

    if (!authorId) {
      res.status(401).json({ message: 'Não autorizado' });
      return;
    }

    const article = await ArticleModel.findById(articleId);
    if (!article) {
      res.status(404).json({ message: 'Artigo não encontrado' });
      return;
    }
    if (article.author_id !== authorId) {
      res.status(403).json({ message: 'Não autorizado a deletar este artigo' });
      return;
    }

    const deleted = await ArticleModel.delete(articleId);
    if (!deleted) {
      res.status(404).json({ message: 'Artigo não encontrado' });
      return;
    }

    res.json({ message: 'Artigo deletado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const getArticleImage: AsyncRequestHandler = async (req, res, next) => {
  try {
    const article = await ArticleModel.findById(Number(req.params.id));
    if (!article || !article.featured_image || !article.image_mime_type) {
      res.status(404).json({ message: 'Imagem não encontrada' });
      return;
    }
    res.set('Content-Type', article.image_mime_type);
    res.send(article.featured_image);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedArticle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        a.id, a.title, a.content, TO_BASE64(a.featured_image) as featured_image, a.image_mime_type,
        a.author_id, u.name AS author_name, a.created_at, a.updated_at
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 1
    `);

    if (rows.length === 0) {
      res.status(404).json({ message: 'Artigo em destaque não encontrado.' });
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar artigo em destaque:', error);
    next(error);
  }
};

export const getRecentArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        a.id, a.title, a.content, TO_BASE64(a.featured_image) as featured_image, a.image_mime_type,
        a.author_id, u.name AS author_name, a.created_at, a.updated_at
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 3
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar artigos recentes:', error);
    next(error);
  }
};

export const getNewArticles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT
        a.id, a.title, a.content, TO_BASE64(a.featured_image) as featured_image, a.image_mime_type,
        a.author_id, u.name AS author_name, a.created_at, a.updated_at
      FROM articles a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 4
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar novos artigos:', error);
    next(error);
  }
};