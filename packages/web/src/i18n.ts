import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import featuresEn from './locales/en/features.json';
import commonEn from './locales/en/common.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        features: featuresEn,
        common: commonEn,
      },
    },
    defaultNS: 'common',
    ns: ['common', 'features'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
