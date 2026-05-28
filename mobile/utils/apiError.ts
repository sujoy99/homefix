import { TFunction } from 'i18next';

type FieldError = { field: string; message: string };

/**
 * Maps a backend error response to a localized message.
 * For VALIDATION_ERROR, surfaces the first field error message.
 * Falls back to the backend's English message, then to t('common.error').
 */
export function getApiError(error: unknown, t: TFunction): string {
  const response = (error as any)?.response?.data;
  const errorCode: string | undefined = response?.error_code;
  const fallbackMessage: string | undefined = response?.message;

  if (errorCode) {
    if (errorCode === 'VALIDATION_ERROR') {
      const fieldErrors: FieldError[] = Array.isArray(response?.body) ? response.body : [];
      if (fieldErrors.length > 0) {
        return fieldErrors[0].message;
      }
    }

    const key = `errors.${errorCode}`;
    const translated = t(key);
    if (translated !== key) {
      return translated;
    }
  }

  return fallbackMessage ?? t('common.error');
}
