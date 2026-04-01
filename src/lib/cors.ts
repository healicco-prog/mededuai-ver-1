/**
 * CORS utility for Next.js API routes
 * Used by middleware to handle preflight OPTIONS requests
 * and by API route handlers to add CORS headers to responses.
 */

const ALLOWED_ORIGINS = [
  'https://www.mededuai.com',
  'https://mededuai.com',
  'https://mededuai.netlify.app',
];

// Also allow origins from env var if set
if (typeof process !== 'undefined' && process.env?.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  for (const origin of envOrigins) {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      ALLOWED_ORIGINS.push(origin);
    }
  }
}

/**
 * Check if the given origin is allowed
 */
export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  // In development, allow localhost
  if (origin.startsWith('http://localhost')) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get CORS headers for a given request origin
 */
export function getCorsHeaders(origin: string | null | undefined): Record<string, string> {
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}
