import { Router } from 'express';
import { register, login, changePasswordByEmail } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password-by-email', changePasswordByEmail);

export default router;