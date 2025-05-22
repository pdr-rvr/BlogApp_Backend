import { Request, Response, NextFunction, RequestHandler } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: number;
      email: string;
    };
  }
}

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;