import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import bn from './locales/bn.json';

const LANGUAGE_KEY = '@homefix_language';

const resources = {
  en: { translation: en },
  bn: { translation: bn },
};

/**
 * Custom language detector to persist the user's language preference.
 */
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (storedLang) {
        callback(storedLang);
        return;
      }
    } catch (error) {
      console.warn('Failed to read language preference from AsyncStorage', error);
    }
    // Default to Bengali per SRS
    callback('bn');
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      console.warn('Failed to save language preference to AsyncStorage', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
