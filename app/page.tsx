'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppProvider, useApp } from './hooks/useApp';
import { useScanner } from './hooks/useScanner';
import { BOARDS } from './lib/vocab';
import { MessageBar, QuickBar } from './components/MessageBar';
import { PhraseBoard } from './components/PhraseBoard';
import { PainBoard } from './components/PainBoard';
import { Keyboard } from './components/Keyboard';
import { CameraGestures } from './components/CameraGestures';
import { GloveBar } from './components/GloveConnect';
import { SettingsPanel } from './components/SettingsPanel';
import { AlarmOverlay, History, PartnerView } from './components/Overlays';

type Tab = 'needs' | 'feel' | 'talk' | 'pain' | 'keyboard' | 'hands' | 'history' | 'settings';

// Bottom bar: the five things used all day, in the thumb zone.
const MAIN_TABS: { id: Tab; icon: string; en: string; hi: string }[] = [
  { id: 'needs', icon: '🙋', en: 'Needs', hi: 'ज़रूरतें' },
  { id: 'feel', icon: '💬', en: 'Feelings', hi: 'भावनाएँ' },
  { id: 'talk', icon: '🗣️', en: 'Talk', hi: 'बातचीत' },
  { id: 'pain', icon: '🤕', en: 'Pain', hi: 'दर्द' },
  { id: 'keyboard', icon: '⌨️', en: 'Type', hi: 'लिखें' },
];

// Header: occasional screens, mostly used by carers.
const TOOL_TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'history', icon: '🕘', label: 'History' },
  { id: 'hands', icon: '📷', label: 'Camera gestures' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const TITLES: Partial<Record<Tab, { en: string; hi: string }>> = {
  history: { en: 'History', hi: 'इतिहास' },
  hands: { en: 'Camera gestures', hi: 'कैमरा इशारे' },
  settings: { en: 'Settings', hi: 'सेटिंग्स' },
};

function Shell() {
  const { settings } = useApp();
  const [tab, setTab] = useState<Tab>('needs');
  const [showPartner, setShowPartner] = useState(false);
  useScanner(settings.scanning, settings.scanMs);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${settings.scale * 100}%`;
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.lang = settings.lang;
  }, [settings.scale, settings.highContrast, settings.lang]);

  const board = BOARDS.find((b) => b.id === tab);
  const title = TITLES[tab];

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+1rem)] sm:px-5">
      <header className="flex flex-wrap items-center gap-2 gap-y-1">
        <GloveBar />
        <div className="ml-auto flex gap-2">
          {TOOL_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-scan
              className="icon-btn"
              aria-label={t.label}
              aria-pressed={tab === t.id}
              onClick={() => setTab(tab === t.id ? 'needs' : t.id)}
            >
              <span aria-hidden>{t.icon}</span>
            </button>
          ))}
        </div>
      </header>

      <QuickBar />
      <MessageBar onShow={() => setShowPartner(true)} />

      <main className="flex-1 pt-1">
        {title && <h1 className="mb-3 text-[1.35em] font-bold">{title[settings.lang]}</h1>}
        <div key={tab} className="fade-in">
          {board && <PhraseBoard board={board} />}
          {tab === 'pain' && <PainBoard />}
          {tab === 'keyboard' && <Keyboard />}
          {tab === 'hands' && <CameraGestures />}
          {tab === 'history' && <History />}
          {tab === 'settings' && <SettingsPanel />}
        </div>
        {tab === 'settings' && (
          <p className="mt-6 text-center text-[0.85em] text-[var(--muted)]">
            Works offline · Everything stays on this device · <Link className="underline" href="/privacy">Privacy</Link>
          </p>
        )}
      </main>

      <nav aria-label="Boards" className="bottom-nav">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {MAIN_TABS.map((t) => (
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
      <Shell />
    </AppProvider>
  );
}
