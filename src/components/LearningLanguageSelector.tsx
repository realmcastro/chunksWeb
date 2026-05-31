'use client';

import { useLearningLanguage } from '@/lib/contexts/LearningLanguageContext';

type LearningLanguage = 'en' | 'pt' | 'es' | 'fr' | 'de';

const languages: { code: LearningLanguage; name: string }[] = [
  { code: 'en', name: '🇺🇸 EN' },
  { code: 'pt', name: '🇧🇷 PT' },
  { code: 'es', name: '🇪🇸 ES' },
  { code: 'fr', name: '🇫🇷 FR' },
  { code: 'de', name: '🇩🇪 DE' },
];

export function LearningLanguageSelector() {
  const { learningLanguage, setLearningLanguage } = useLearningLanguage();

  return (
    <select
      value={learningLanguage}
      onChange={(e) => setLearningLanguage(e.target.value as LearningLanguage)}
      className="w-full px-2 py-1.5 border border-border rounded-md bg-background text-foreground text-xs font-semibold min-w-[80px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
