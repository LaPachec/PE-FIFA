import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../shared/errors/app-error.js';

type JwtPayload = {
  userId: string;
};

const tokenTtlSeconds = 60 * 60 * 24 * 7;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT_SECRET is not configured', 500);
  }

  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signContent(content: string) {
  return createHmac('sha256', getJwtSecret()).update(content).digest('base64url');
}

export function signAuthToken(payload: JwtPayload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + tokenTtlSeconds,
    }),
  );
  const content = `${header}.${body}`;
  const signature = signContent(content);

  return `${content}.${signature}`;
}

export function verifyAuthToken(token: string): JwtPayload {
  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    throw new AppError('Invalid authentication token', 401);
  }

  const content = `${header}.${body}`;
  const expectedSignature = signContent(content);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new AppError('Invalid authentication token', 401);
  }

  let payload: JwtPayload & { exp?: number };

  try {
    payload = JSON.parse(base64UrlDecode(body)) as JwtPayload & { exp?: number };
  } catch {
    throw new AppError('Invalid authentication token', 401);
  }

  if (!payload.userId) {
    throw new AppError('Invalid authentication token', 401);
  }

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError('Authentication token expired', 401);
  }

  return { userId: payload.userId };
}
