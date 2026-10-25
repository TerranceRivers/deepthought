import React, { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppButton: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isStandalone || (!installPrompt && !isIos)) return null;

  const install = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2">
      {showIosHelp && (
        <div className="max-w-64 rounded-2xl border border-stone-200 bg-white p-3 text-xs text-stone-700 shadow-xl dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200">
          <button className="float-right ml-2 text-stone-400" onClick={() => setShowIosHelp(false)} aria-label="Close install help">×</button>
          In Safari, tap <Share className="mx-1 inline h-4 w-4" /> Share, then choose <strong>Add to Home Screen</strong>.
        </div>
      )}
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-700"
      >
        <Download className="h-4 w-4" />
        Install app
      </button>
    </div>
  );
};
