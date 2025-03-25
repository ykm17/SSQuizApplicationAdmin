import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import en from './en.json';
import hi from './hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi }
};

// Get device language
const deviceLanguage = getLocales()[0].languageCode;
const supportedLanguages = ['en', 'hi'];
const fallbackLanguage = 'en';

// Use device language if supported, otherwise fallback to English
const defaultLanguage = supportedLanguages.includes(deviceLanguage) 
  ? deviceLanguage 
  : fallbackLanguage;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: fallbackLanguage,
    interpolation: {
      escapeValue: false
    },
    compatibilityJSON: 'v3'
  });

export default i18n;