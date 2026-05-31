'use client';

import { Sun, Moon, Monitor, Volume2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { applyTTSSettings } from '@/lib/pronunciation/hooks/useTTSPlaybackClient';
import type { Locale } from '@/lib/pronunciation/types';

/*
? Maps a browser voice lang tag to the nearest supported Locale.
! Unsupported language prefixes (es, pt) fall back to 'en-US' — the Locale type has no es/pt entries.
*/
function inferLocale(lang: string): Locale {
  if (lang.startsWith('fr-CA')) return 'fr-CA';
  if (lang.startsWith('fr')) return 'fr-FR';
  if (lang.startsWith('de')) return 'de-DE';
  if (lang.startsWith('en-GB')) return 'en-GB';
  if (lang.startsWith('en-CA')) return 'en-CA';
  if (lang.startsWith('en-AU')) return 'en-AU';
  return 'en-US';
}

/*
! Invariantes, contratos, pré-condições, decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- Settings page: User preferences and app configuration
- Theme selection, study preferences
- Simple layout with grouped settings
*/

interface BrowserVoice {
  uri: string;
  name: string;
  lang: string;
}

type LangTab = 'en' | 'fr' | 'es' | 'pt' | 'de';

const LANG_TABS: { code: LangTab; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
];

const LANG_TO_LOCALE: Record<LangTab, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  pt: 'pt-BR',
  de: 'de-DE',
};

/*
! voiceByLang is the per-language voice selection; selectedVoiceURI is derived from it.
! Save persists all configured voices via separate API calls — one per locale.
? applyTTSSettings writes per-locale keys to localStorage so TTS hooks read the correct
? voice automatically when learningLanguage changes.
*/
function VoiceSettingsSection() {
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [wordGap, setWordGap] = useState(0);
  const [voices, setVoices] = useState<BrowserVoice[]>([]);
  const [selectedLang, setSelectedLang] = useState<LangTab>('en');
  const [voiceByLang, setVoiceByLang] = useState<Record<LangTab, string>>({
    en: '',
    fr: '',
    es: '',
    pt: '',
    de: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const selectedVoiceURI = voiceByLang[selectedLang];
  const filteredVoices = voices.filter((v) => v.lang.startsWith(selectedLang));

  // Load browser voices
  useEffect(() => {
    function loadVoices() {
      const all = window.speechSynthesis.getVoices();
      setVoices(all.map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang })));
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Load saved settings: localStorage first (instant), then API as source of truth
  useEffect(() => {
    try {
      const raw = localStorage.getItem('tts-voice-settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.rate) setRate(s.rate);
        if (s.pitch) setPitch(s.pitch);
        if (s.wordGap !== undefined) setWordGap(s.wordGap);
        if (s.voiceURI) setVoiceByLang((prev) => ({ ...prev, en: s.voiceURI }));
      }
    } catch {}

    fetch('/api/voice-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setRate(data.ttsSettings?.defaultRate ?? 1.0);
        setPitch(data.ttsSettings?.defaultPitch ?? 1.0);
        const prefs: Array<{ locale: string; voiceURI: string | null }> =
          data.voicePreferences ?? [];
        const updated: Record<LangTab, string> = { en: '', fr: '', es: '', pt: '', de: '' };
        for (const pref of prefs) {
          if (!pref.voiceURI) continue;
          if (pref.locale.startsWith('en')) updated.en = pref.voiceURI;
          else if (pref.locale.startsWith('fr')) updated.fr = pref.voiceURI;
          else if (pref.locale.startsWith('es')) updated.es = pref.voiceURI;
          else if (pref.locale.startsWith('pt')) updated.pt = pref.voiceURI;
          else if (pref.locale.startsWith('de')) updated.de = pref.voiceURI;
        }
        setVoiceByLang(updated);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleVoiceChange = useCallback(
    (uri: string) => setVoiceByLang((prev) => ({ ...prev, [selectedLang]: uri })),
    [selectedLang],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const saveTasks = (Object.entries(voiceByLang) as [LangTab, string][])
        .filter(([, uri]) => uri !== '')
        .map(([, uri]) => {
          const voice = voices.find((v) => v.uri === uri);
          return fetch('/api/voice-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rate,
              pitch,
              volume: 1.0,
              locale: inferLocale(voice?.lang ?? ''),
              voiceURI: voice?.uri ?? null,
              voiceName: voice?.name ?? null,
            }),
          });
        });

      await Promise.all(saveTasks);

      for (const tab of LANG_TABS) {
        const uri = voiceByLang[tab.code];
        const voice = uri ? voices.find((v) => v.uri === uri) : undefined;
        applyTTSSettings(
          {
            rate,
            pitch,
            volume: 1.0,
            wordGap,
            ...(voice ? { voiceURI: voice.uri, voiceName: voice.name } : {}),
          },
          LANG_TO_LOCALE[tab.code],
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [rate, pitch, wordGap, voiceByLang, voices]);

  const preview = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const previewTexts: Record<LangTab, string> = {
      en: 'Hello, this is a preview of the selected voice.',
      fr: 'Bonjour, ceci est un aperçu de la voix sélectionnée.',
      es: 'Hola, esta es una vista previa de la voz seleccionada.',
      pt: 'Olá, esta é uma prévia da voz selecionada.',
      de: 'Hallo, dies ist eine Vorschau der ausgewählten Stimme.',
    };
    const text = previewTexts[selectedLang];

    const makeUtterance = (word: string) => {
      const u = new SpeechSynthesisUtterance(word);
      u.rate = rate;
      u.pitch = pitch;
      u.volume = 1.0;
      if (selectedVoiceURI) {
        const v = window.speechSynthesis.getVoices().find((x) => x.voiceURI === selectedVoiceURI);
        if (v) u.voice = v;
      }
      return u;
    };

    if (wordGap <= 0) {
      window.speechSynthesis.speak(makeUtterance(text));
      return;
    }

    const words = text.split(/\s+/);
    const speakNext = (index: number) => {
      if (index >= words.length) return;
      const u = makeUtterance(words[index]);
      u.onend = () => setTimeout(() => speakNext(index + 1), wordGap);
      window.speechSynthesis.speak(u);
    };
    speakNext(0);
  }, [rate, pitch, wordGap, selectedVoiceURI, selectedLang]);

  if (!loaded) return null;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          Voice & Pronunciation
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure the voice used when pronouncing words and phrases
        </p>
      </div>
      <div className="p-4 space-y-5">
        {/* Language tabs + Voice selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Voice</label>
          <div className="flex gap-1 mb-2 border border-border rounded-md p-1 bg-muted/30">
            {LANG_TABS.map((tab) => {
              const count = voices.filter((v) => v.lang.startsWith(tab.code)).length;
              return (
                <button
                  key={tab.code}
                  onClick={() => setSelectedLang(tab.code)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                    selectedLang === tab.code
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {count > 0 && <span className="ml-1 text-[10px] opacity-60">({count})</span>}
                </button>
              );
            })}
          </div>
          <select
            value={selectedVoiceURI}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="">— System default —</option>
            {filteredVoices.map((v) => (
              <option key={v.uri} value={v.uri}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {filteredVoices.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No {LANG_TABS.find((t) => t.code === selectedLang)?.label} voices found in this
              browser.
            </p>
          )}
        </div>

        {/* Speed slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium">Speed</label>
            <span className="text-sm text-muted-foreground">{rate.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>0.5× slow</span>
            <span>1.0× normal</span>
            <span>2.0× fast</span>
          </div>
        </div>

        {/* Pitch slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium">Pitch</label>
            <span className="text-sm text-muted-foreground">{pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>0.5 lower</span>
            <span>1.0 normal</span>
            <span>1.5 higher</span>
          </div>
        </div>

        {/* Word pause slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium">Word Pause</label>
            <span className="text-sm text-muted-foreground">{wordGap}ms</span>
          </div>
          <input
            type="range"
            min={0}
            max={800}
            step={50}
            value={wordGap}
            onChange={(e) => setWordGap(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
            <span>0 none</span>
            <span>400ms medium</span>
            <span>800ms long</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={preview}
            className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [dailyGoal, setDailyGoal] = useState(30);
  const [newChunksPerDay, setNewChunksPerDay] = useState(10);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) setTheme(savedTheme);
    const savedGoal = localStorage.getItem('dailyGoal');
    if (savedGoal) setDailyGoal(parseInt(savedGoal, 10));
    const savedNew = localStorage.getItem('newChunksPerDay');
    if (savedNew) setNewChunksPerDay(parseInt(savedNew, 10));
  }, []);

  const handleDailyGoalChange = (value: number) => {
    setDailyGoal(value);
    localStorage.setItem('dailyGoal', String(value));
  };

  const handleNewChunksChange = (value: number) => {
    setNewChunksPerDay(value);
    localStorage.setItem('newChunksPerDay', String(value));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(isDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(newTheme);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.customizeExperience')}</p>
      </div>

      {/* Appearance */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold">{t('settings.appearance')}</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('settings.theme')}</label>
            <div className="flex gap-3">
              <ThemeButton
                icon={<Sun className="h-5 w-5" />}
                label={t('settings.light')}
                active={theme === 'light'}
                onClick={() => handleThemeChange('light')}
              />
              <ThemeButton
                icon={<Moon className="h-5 w-5" />}
                label={t('settings.dark')}
                active={theme === 'dark'}
                onClick={() => handleThemeChange('dark')}
              />
              <ThemeButton
                icon={<Monitor className="h-5 w-5" />}
                label={t('settings.system')}
                active={theme === 'system'}
                onClick={() => handleThemeChange('system')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Study Preferences */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold">{t('settings.studyPreferences')}</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('settings.dailyGoal')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.dailyGoalDesc')}</p>
            </div>
            <select
              value={dailyGoal}
              onChange={(e) => handleDailyGoalChange(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('settings.newChunksPerDay')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.newChunksPerDayDesc')}</p>
            </div>
            <select
              value={newChunksPerDay}
              onChange={(e) => handleNewChunksChange(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <VoiceSettingsSection />

      {/* Data Export */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold">Data export</h2>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Download your study progress and favorites for backup or analysis.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/progress/export?format=json"
              className="px-3 py-2 rounded-md border border-border hover:bg-accent text-sm"
            >
              Download JSON
            </a>
            <a
              href="/api/progress/export?format=csv"
              className="px-3 py-2 rounded-md border border-border hover:bg-accent text-sm"
            >
              Download CSV
            </a>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold">{t('settings.about')}</h2>
        </div>
        <div className="p-4 space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>OLife&apos;S</strong> v1.0.0
          </p>
          <p>{t('settings.aboutDescription')}</p>
          <p>{t('settings.builtWith')}</p>
        </div>
      </div>
    </div>
  );
}

function ThemeButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${active ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
