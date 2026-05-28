'use client';

import { useTranslation } from '@/lib/i18n/I18nProvider';

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
  { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
  { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as typeof language)}
      className="w-full px-2 py-1.5 border rounded-md bg-background text-foreground text-xs min-w-[80px]"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
