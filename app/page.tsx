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

type Tab = (typeof BOARDS)[number]['id'] | 'pain' | 'keyboard' | 'hands' | 'history' | 'settings';

const EXTRA_TABS: { id: Tab; icon: string; en: string; hi: string }[] = [
  { id: 'pain', icon: '🤕', en: 'Pain', hi: 'दर्द' },
  { id: 'keyboard', icon: '⌨️', en: 'Type', hi: 'लिखें' },
  { id: 'hands', icon: '📷', en: 'Camera', hi: 'कैमरा' },
  { id: 'history', icon: '🕘', en: 'History', hi: 'इतिहास' },
  { id: 'settings', icon: '⚙️', en: 'Settings', hi: 'सेटिंग्स' },
];

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

  const tabs = [
    ...BOARDS.map((b) => ({ id: b.id as Tab, icon: b.icon, en: b.title.en, hi: b.title.hi })),
    ...EXTRA_TABS,
  ];
  const board = BOARDS.find((b) => b.id === tab);

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-3 p-3 sm:p-4">
      <GloveBar />
      <QuickBar />
      <MessageBar onShow={() => setShowPartner(true)} />

      <nav aria-label="Boards" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            data-scan
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-xl border-2 px-3 py-2 font-semibold ${
              tab === t.id ? 'border-transparent bg-[var(--accent)] text-white' : 'border-[var(--line)] bg-[var(--panel)]'
            }`}
          >
            <span aria-hidden className="mr-1">{t.icon}</span>
            {t[settings.lang]}
          </button>
        ))}
      </nav>

      <main className="flex-1">
        {board && <PhraseBoard board={board} />}
        {tab === 'pain' && <PainBoard />}
        {tab === 'keyboard' && <Keyboard />}
        {tab === 'hands' && <CameraGestures />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <SettingsPanel />}
      </main>

      <footer className="pt-2 text-center text-[0.8em] text-[var(--muted)]">
        Works offline · Everything stays on this device · <Link className="underline" href="/privacy">Privacy</Link>
      </footer>

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
