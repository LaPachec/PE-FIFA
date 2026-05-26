import {
  authenticatedRequest,
  clearStoredAuthToken,
  request,
  setStoredAuthToken,
} from '@/services/api-client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export async function register(payload: RegisterPayload) {
  const response = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  setStoredAuthToken(response.token);
  return response;
}

export async function login(payload: LoginPayload) {
  const response = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  setStoredAuthToken(response.token);
  return response;
}

export function getMe() {
  return authenticatedRequest<AuthUser>('/auth/me');
}

export function logout() {
  clearStoredAuthToken();
}
