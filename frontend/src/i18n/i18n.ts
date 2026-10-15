import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import am from './am.json'
import om from './om.json'

const savedLanguage = localStorage.getItem('app-language')

const initialLanguage =
  savedLanguage === 'am' || savedLanguage === 'om'
    ? savedLanguage
    : 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
    om: { translation: om }
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

i18n.on('languageChanged', (language) => {
  const baseLanguage = language.split('-')[0]
  localStorage.setItem('app-language', baseLanguage)
  document.documentElement.lang = baseLanguage
})

document.documentElement.lang = initialLanguage

export default i18n