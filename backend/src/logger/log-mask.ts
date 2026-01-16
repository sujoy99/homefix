const SENSITIVE_KEYS = [
    'password',
    'otp',
    'pin',
    'nid',
    'phone',
    'email',
    'authorization',
    'refreshToken',
    'accessToken'
];

function maskValue(value: string): string {
  if (value.length <= 4) return '****';

  const visible = 3;
  const start = value.slice(0, visible);
  const end = value.slice(-visible);

  return `${start}${'*'.repeat(value.length - visible * 2)}${end}`;
}

export function maskSensitiveData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  if (typeof data === 'object' && data !== null) {
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        masked[key] =
          typeof value === 'string' ? maskValue(value) : '****';
      } else {
        masked[key] = maskSensitiveData(value);
      }
    }

    return masked;
  }

  return data;
}
