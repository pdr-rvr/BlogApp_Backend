import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as articlesController from '../controllers/articles.controller';

const router = Router();

router.get('/', articlesController.getAllArticles);
router.get('/:id', articlesController.getArticleById);
router.get('/:id/image', articlesController.getArticleImage);

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

export default router;