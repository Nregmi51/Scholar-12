import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  onOpenApkGuide?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  onOpenApkGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{compact ? 'Install App' : 'Install Offline App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3 id="ios-install-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                  Install on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close instructions"
                  className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 list-decimal pl-5">
                <li>
                  Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>.
                </li>
                <li>
                  Launch <strong className="text-slate-900 dark:text-white">Scholar12</strong> from your home screen for offline study.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-sky-600 text-white text-sm font-medium hover:bg-slate-800 dark:hover:bg-sky-500 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (onOpenApkGuide) {
    return (
      <button
        type="button"
        onClick={onOpenApkGuide}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        <span>Get Mobile APK</span>
      </button>
    );
  }

  return null;
};
