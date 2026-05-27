const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const authTokenKey = 'fifa_tournament_manager_token';

export function getStoredAuthToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(authTokenKey);
}

export function setStoredAuthToken(token: string) {
  window.localStorage.setItem(authTokenKey, token);
}

export function clearStoredAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(authTokenKey);
}

export async function request<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL nao esta configurada.');
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? 'Erro ao comunicar com a API');
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export async function authenticatedRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const token = getStoredAuthToken();

  if (!token) {
    throw new Error('Sessao expirada. Faca login novamente.');
  }

  try {
    return await request<TResponse>(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && /token|auth|sessao|401/i.test(error.message)) {
      clearStoredAuthToken();
    }

    throw error;
  }
}
