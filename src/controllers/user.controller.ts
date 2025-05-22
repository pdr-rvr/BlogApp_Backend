import { AsyncRequestHandler } from '../types/express';
import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user.model';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();

export const uploadProfileImage = multer({ storage });

export const getUserProfile: AsyncRequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Não autorizado: ID do usuário ausente.' });
      return;
    }

    const user = await UserModel.findByIdWithProfileImage(userId);

    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return;
    }

    let profilePictureUrl: string | null = null;
    if (user.profilePictureBase64 && user.profile_picture_mime_type) {
      profilePictureUrl = `data:${user.profile_picture_mime_type};base64,${user.profilePictureBase64}`;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePictureUrl: profilePictureUrl,
    });
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    next(error);
  }
};

export const updateProfile: AsyncRequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Não autorizado.' });
      return;
    }

    const { name } = req.body;

    const updateData: { name?: string;} = {};
    if (name) updateData.name = name;
 
    let hasUpdates = false;

    if (req.file) {
      const profileImageData = req.file.buffer;
      const profileImageMimeType = req.file.mimetype;

      const imageUpdated = await UserModel.updateProfilePicture(userId, profileImageData, profileImageMimeType);
      if (imageUpdated) hasUpdates = true;
    }

    if (Object.keys(updateData).length > 0) {
      const profileUpdated = await UserModel.updateProfile(userId, updateData);
      if (profileUpdated) hasUpdates = true;
    }

    if (hasUpdates) {
      res.json({ message: 'Perfil atualizado com sucesso!' });
    } else {
      res.status(400).json({ message: 'Nenhuma alteração detectada ou erro na atualização.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    next(error);
  }
};