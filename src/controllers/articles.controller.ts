import { Request, Response } from 'express';
import ArticleModel from '../models/article.model';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Multer } from 'multer';

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload: Multer = multer({ storage });

export const getAllArticles = async (req: Request, res: Response) => {
  try {
    const articles = await ArticleModel.findAll();
    res.json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  try {
    const article = await ArticleModel.findById(Number(req.params.id));
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createArticle = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const authorId = (req as any).user.id;

    let featuredImage: Buffer | null = null;
    let imageMimeType: string | null = null;

    if (req.file) {
      featuredImage = fs.readFileSync(req.file.path);
      imageMimeType = req.file.mimetype;
      fs.unlinkSync(req.file.path);
    }

    const articleId = await ArticleModel.create({
      title,
      content,
      featured_image: featuredImage,
      image_mime_type: imageMimeType,
      author_id: authorId
    });

    res.status(201).json({ id: articleId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const articleId = Number(req.params.id);
    const authorId = (req as any).user.id;

    const article = await ArticleModel.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    if (article.author_id !== authorId) {
      return res.status(403).json({ message: 'Not authorized to update this article' });
    }

    let featuredImage: Buffer | null = article.featured_image;
    let imageMimeType: string | null = article.image_mime_type;

    if (req.file) {
      featuredImage = fs.readFileSync(req.file.path);
      imageMimeType = req.file.mimetype;
      fs.unlinkSync(req.file.path);
    }

    const updateData = {
      title: title || article.title,
      content: content || article.content,
      featured_image: featuredImage,
      image_mime_type: imageMimeType
    };

    const updated = await ArticleModel.update(articleId, updateData);

    if (!updated) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const articleId = Number(req.params.id);
    const authorId = (req as any).user.id;

    const article = await ArticleModel.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    if (article.author_id !== authorId) {
      return res.status(403).json({ message: 'Not authorized to delete this article' });
    }

    const deleted = await ArticleModel.delete(articleId);
    if (!deleted) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getArticleImage = async (req: Request, res: Response) => {
  try {
    const article = await ArticleModel.findById(Number(req.params.id));
    if (!article || !article.featured_image || !article.image_mime_type) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.set('Content-Type', article.image_mime_type);
    res.send(article.featured_image);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};