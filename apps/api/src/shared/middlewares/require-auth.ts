import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@fifa-tournament-manager/database';
import { AppError } from '../errors/app-error.js';
import { verifyAuthToken } from '../../modules/auth/jwt.service.js';

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

const authenticatedUsers = new WeakMap<Request, AuthenticatedUser>();

export function getAuthenticatedUser(request: Request) {
  const user = authenticatedUsers.get(request);

  if (!user) {
    throw new AppError('Authentication is required', 401);
  }

  return user;
}

export function getAuthenticatedUserId(request: Request) {
  return getAuthenticatedUser(request).id;
}

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication is required', 401);
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new AppError('Invalid authentication token', 401);
    }

    authenticatedUsers.set(request, user);
    next();
  } catch (error) {
    next(error);
  }
}
