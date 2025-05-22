import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ message: 'Nenhum token fornecido' });
    return; // MUDANÇA: REMOVIDO o `return` ANTES de `res.status()`, mas o `return;` para sair da função é opcional e pode ajudar na legibilidade.
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
    // MUDANÇA: REMOVIDO o `return` ANTES de `res.status()`.
    // Não precisa de `return;` aqui pois a requisição já foi encerrada.
  }
};