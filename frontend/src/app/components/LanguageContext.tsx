import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';

export type AppLanguage = 'en' | 'es' | 'fr' | 'hi';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'originx-language';

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    settingsTitle: 'Settings',
    settingsSubtitle: 'Choose your appearance and language preferences',
    appearanceTitle: 'Appearance',
    darkModeLabel: 'Dark Mode',
    darkModeDescDark: 'Switch to light theme',
    darkModeDescLight: 'Switch to dark theme',
    languageTitle: 'Language',
    languageLabel: 'App Language',
    languageHint: 'This choice is saved for your next visit.',
  },
  es: {
    settingsTitle: 'Configuracion',
    settingsSubtitle: 'Elige tus preferencias de apariencia e idioma',
    appearanceTitle: 'Apariencia',
    darkModeLabel: 'Modo Oscuro',
    darkModeDescDark: 'Cambiar a tema claro',
    darkModeDescLight: 'Cambiar a tema oscuro',
    languageTitle: 'Idioma',
    languageLabel: 'Idioma de la aplicacion',
    languageHint: 'Esta opcion se guarda para tu proxima visita.',
  },
  fr: {
    settingsTitle: 'Parametres',
    settingsSubtitle: 'Choisissez vos preferences d apparence et de langue',
    appearanceTitle: 'Apparence',
    darkModeLabel: 'Mode Sombre',
    darkModeDescDark: 'Passer au theme clair',
    darkModeDescLight: 'Passer au theme sombre',
    languageTitle: 'Langue',
    languageLabel: 'Langue de l application',
    languageHint: 'Ce choix est enregistre pour votre prochaine visite.',
  },
  hi: {
    settingsTitle: 'Settings',
    settingsSubtitle: 'Apni appearance aur language preference chunen',
    appearanceTitle: 'Appearance',
    darkModeLabel: 'Dark Mode',
    darkModeDescDark: 'Light theme par switch karein',
    darkModeDescLight: 'Dark theme par switch karein',
    languageTitle: 'Language',
    languageLabel: 'App Language',
    languageHint: 'Yeh choice aapki next visit ke liye save rahegi.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'es' || saved === 'fr' || saved === 'hi') {
      return saved;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const t = useMemo(() => {
    return (key: string) => translations[language][key] || translations.en[key] || key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
