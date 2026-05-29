import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  const renderApiUrl = process.env.RENDER_API_URL;

  if (!renderApiUrl) {
    return NextResponse.json(
      {
        ok: false,
        status: null,
        timestamp,
        message: 'RENDER_API_URL nao esta configurada.',
      },
      { status: 500 },
    );
  }

  const healthUrl = `${renderApiUrl.replace(/\/$/, '')}/health`;

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          timestamp,
          message: 'A API respondeu com status inesperado.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      timestamp,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: null,
        timestamp,
        message: 'Nao foi possivel chamar o health check da API.',
      },
      { status: 500 },
    );
  }
}
