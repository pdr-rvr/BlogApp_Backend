import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as articlesController from '../controllers/articles.controller';

const router = Router();

router.get('/recent', articlesController.getRecentArticles);   
router.get('/new', articlesController.getNewArticles);     


router.get('/:id', articlesController.getArticleById);     

router.get('/', articlesController.getAllArticles);           

router.post(
  '/',
  authenticate,
  articlesController.upload.single('featured_image'),
  articlesController.createArticle
);

router.put(
  '/:id',
  authenticate,
  articlesController.upload.single('featured_image'),
  articlesController.updateArticle
);

router.delete(
  '/:id',
  authenticate,
  articlesController.deleteArticle
);

router.get('/:id/image', articlesController.getArticleImage);

export default router;