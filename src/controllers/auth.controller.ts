import { AsyncRequestHandler } from '../types/express';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import UserModel from '../models/user.model';

const jwtSecret = process.env.JWT_SECRET as Secret;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

export const register: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
      res.status(400).json({ message: 'E-mail já em uso' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await UserModel.create({ name, email, password: hashedPassword });
    res.status(201).json({ id: userId, name, email });
  } catch (error) {
    next(error);
  }
};

export const login: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret as jwt.Secret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );

    const userInfo = await UserModel.findById(user.id);
    res.json({ token, user: userInfo });
  } catch (error) {
    next(error);
  }
};


export const changePasswordByEmail: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400).json({ message: 'E-mail e nova senha são obrigatórios.' });
      return;
    }

    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.status(404).json({ message: 'Não foi possível alterar a senha. Verifique o email ou tente novamente.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const success = await UserModel.updatePasswordByEmail(email, hashedPassword);

    if (success) {
      res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } else {
      res.status(500).json({ message: 'Erro ao alterar a senha. Tente novamente mais tarde.' });
    }
  } catch (error) {
    next(error);
  }
};