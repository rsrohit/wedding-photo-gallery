export type EventPhotoPath = {
  eventSlug: string;
  photoId: string;
};

export function createCorsHeaders(
  origin: string | null,
  allowedOrigins: string[]
): Record<string, string> {
  const allowOrigin =
    allowedOrigins.length === 0 || !origin
      ? '*'
      : allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0];

  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-token',
    'access-control-max-age': '86400'
  };
}

export function withCorsHeaders(headers: Headers, origin: string | null, allowedOrigins: string[]) {
  const corsHeaders = createCorsHeaders(origin, allowedOrigins);

  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  return headers;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  origin: string | null = '*',
  allowedOrigins: string[] = []
): Response {
  const effectiveAllowedOrigins =
    allowedOrigins.length === 0 && origin && origin !== '*' ? [origin] : allowedOrigins;
  const headers = withCorsHeaders(
    new Headers({ 'content-type': 'application/json; charset=utf-8' }),
    origin,
    effectiveAllowedOrigins
  );

  return new Response(JSON.stringify(body), { status, headers });
}

export function errorResponse(
  message: string,
  status = 400,
  origin: string | null = '*',
  allowedOrigins: string[] = []
): Response {
  return jsonResponse({ error: message }, status, origin, allowedOrigins);
}

export function parseEventPhotoPath(pathname: string): EventPhotoPath | null {
  const match = pathname.match(/^\/api\/events\/([^/]+)\/photos\/([^/]+)\/file$/);

  if (!match) {
    return null;
  }

  return {
    eventSlug: decodeURIComponent(match[1]),
    photoId: decodeURIComponent(match[2])
  };
}
