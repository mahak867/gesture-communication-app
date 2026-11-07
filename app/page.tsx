'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppProvider, useApp } from './hooks/useApp';
import { GloveProvider } from './hooks/useGlove';
import { ProfilesProvider, useProfiles } from './hooks/useProfiles';
import { TranslatorProvider } from './hooks/useTranslator';
import { useScanner } from './hooks/useScanner';
import { GloveBar } from './components/GloveBar';
import { TranslateView } from './components/TranslateView';
import { SignsView } from './components/SignsView';
import { BoardView } from './components/BoardView';
import { SettingsPanel } from './components/SettingsPanel';
import { ProfilesPanel } from './components/ProfilesPanel';
import { AlarmOverlay, History, PartnerView } from './components/Overlays';

type Tab = 'translate' | 'signs' | 'board' | 'history' | 'settings';

const TABS: { id: Tab; icon: string; en: string; hi: string }[] = [
  { id: 'translate', icon: '🧤', en: 'Translate', hi: 'अनुवाद' },
  { id: 'signs', icon: '✋', en: 'Signs', hi: 'इशारे' },
  { id: 'board', icon: '🗂️', en: 'Board', hi: 'बोर्ड' },
  { id: 'history', icon: '🕘', en: 'History', hi: 'इतिहास' },
  { id: 'settings', icon: '⚙️', en: 'Settings', hi: 'सेटिंग्स' },
];

function Shell() {
  const { settings } = useApp();
  const { active } = useProfiles();
  const [tab, setTab] = useState<Tab>('translate');
  const [showPartner, setShowPartner] = useState(false);
  useScanner(settings.scanning, settings.scanMs);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${settings.scale * 100}%`;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.lang = settings.lang;
  }, [settings.scale, settings.highContrast, settings.lang]);

  const show = () => setShowPartner(true);

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+1rem)] sm:px-5">
      <header className="flex items-center gap-2">
        <GloveBar />
        {active && (
          <button type="button" className="pill ml-auto min-w-0" onClick={() => setTab('settings')} aria-label={`Person: ${active.name}. Change in settings`}>
            <span aria-hidden>👤</span>
            <span className="truncate">{active.name}</span>
          </button>
        )}
      </header>

      <main className="flex-1">
        <div key={tab} className="fade-in">
          {tab === 'translate' && <TranslateView onShow={show} goSigns={() => setTab('signs')} />}
          {tab === 'signs' && <SignsView />}
          {tab === 'board' && <BoardView onShow={show} />}
          {tab === 'history' && <History />}
          {tab === 'settings' && (
            <div className="grid gap-4">
              <ProfilesPanel />
              <SettingsPanel />
              <p className="text-center text-[0.85em] text-[var(--muted)]">
                Works offline · Everything stays on this device · <Link className="underline" href="/privacy">Privacy</Link>
              </p>
            </div>
          )}
        </div>
      </main>

      <nav aria-label="Main" className="bottom-nav">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-scan
              className="tab"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              <span aria-hidden className="tab-icon">{t.icon}</span>
              {t[settings.lang]}
            </button>
          ))}
        </div>
      </nav>

      {showPartner && <PartnerView onClose={() => setShowPartner(false)} />}
      <AlarmOverlay />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <GloveProvider>
        <ProfilesProvider>
          <TranslatorProvider>
            <Shell />
          </TranslatorProvider>
        </ProfilesProvider>
      </GloveProvider>
    </AppProvider>
  );
}
