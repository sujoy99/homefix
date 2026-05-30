import { SERVER_ROOT } from '@/api/client';

/**
 * Converts a relative storage path returned by the backend (e.g. /uploads/abc.jpg)
 * into a full URL the React Native Image component can fetch.
 * Already-absolute URLs (http/https) are returned unchanged — safe to call on S3 URLs.
 */
export function resolveMediaUrl(url: unknown): string {
  // Defensive: DB rows from older uploads may contain { url, key } objects
  const s: string =
    typeof url === 'string' ? url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : typeof (url as any)?.url === 'string' ? (url as any).url
    : '';
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `${SERVER_ROOT}${s.startsWith('/') ? '' : '/'}${s}`;
}
