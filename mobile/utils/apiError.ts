import { TFunction } from 'i18next';

/**
 * Maps a backend error_code to a localized message.
 * Falls back to the backend's English message, then to t('common.error').
 */
export function getApiError(error: unknown, t: TFunction): string {
  const response = (error as any)?.response?.data;
  const errorCode: string | undefined = response?.error_code;
  const fallbackMessage: string | undefined = response?.message;

  if (errorCode) {
    const key = `errors.${errorCode}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }

  return fallbackMessage ?? t('common.error');
}
