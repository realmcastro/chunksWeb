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
      className="w-full px-2 py-1.5 border-2 border-primary/30 rounded-md bg-primary/10 text-primary-foreground text-xs font-semibold min-w-[80px]"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
