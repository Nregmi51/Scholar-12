import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, Github, ShieldCheck, Smartphone } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface ApkBuilderViewProps {
  defaultAppName?: string;
}

export const ApkBuilderView: React.FC<ApkBuilderViewProps> = ({
  defaultAppName = 'Scholar12',
}) => {
  const [appName, setAppName] = useState(defaultAppName);
  const [appId, setAppId] = useState('com.scholar12.grade12study');
  const [copiedKey, setCopiedKey] = useState<'workflow' | 'capacitor' | null>(null);

  const capacitorConfig = useMemo(() => {
    return JSON.stringify(
      {
        appId: appId.trim() || 'com.scholar12.grade12study',
        appName: appName.trim() || 'Scholar12',
        webDir: 'dist',
        android: {
          allowMixedContent: false,
          captureInput: true,
        },
        server: {
          androidScheme: 'https',
        },
      },
      null,
      2
    );
  }, [appId, appName]);

  const workflowYaml = useMemo(() => {
    const safeName = (appName.trim() || 'Scholar12').replace(/[^a-zA-Z0-9_-]/g, '');
    return `name: Build Android APK on GitHub

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-android-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - name: Install dependencies & build web bundle
        run: |
          npm install
          npm run build

      - name: Initialize Capacitor Android project
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap add android || true
          npx cap sync android

      - name: Build Android APK with Gradle
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK artifact to GitHub
        uses: actions/upload-artifact@v4
        with:
          name: ${safeName}-android-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk

      - name: Publish APK to GitHub Releases
        uses: softprops/action-gh-release@v2
        with:
          tag_name: apk-\${{ github.run_number }}
          name: "${appName.trim() || 'Scholar12'} Android APK (Build \${{ github.run_number }})"
          files: android/app/build/outputs/apk/debug/app-debug.apk
`;
  }, [appName]);

  const handleCopy = async (text: string, key: 'workflow' | 'capacitor') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-12 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mobile App &amp; GitHub-Only APK Build
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Install immediately as an offline mobile app, or compile a standalone Android <code className="font-study-mono">.apk</code> directly inside your own GitHub repository using GitHub Actions—with zero external APK hosting.
        </p>
      </div>

      {/* Instant Offline App Install Card */}
      <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Option 1 · Instant Offline Mobile App (PWA)
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Install Scholar12 straight to your Android or iOS home screen. All synced GitHub documents stay cached locally in IndexedDB and work in airplane mode.
          </p>
        </div>
        <div className="shrink-0">
          <PWAInstallButton />
        </div>
      </section>

      {/* GitHub Actions Native APK Pipeline */}
      <section className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
        <div className="flex items-start gap-3">
          <Github className="w-5 h-5 text-slate-900 dark:text-white mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Option 2 · Compile Android APK Directly in GitHub Actions
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              No external APK builders or third-party hosting required. GitHub compiles the web app and Capacitor Android shell on <code className="font-study-mono">ubuntu-latest</code> and publishes the <code className="font-study-mono">.apk</code> file directly to your repository&apos;s Releases tab.
            </p>
          </div>
        </div>

        {/* APK Customization Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label htmlFor="apk-app-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Android App Name
            </label>
            <input
              id="apk-app-name"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label htmlFor="apk-app-id" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Android Package ID
            </label>
            <input
              id="apk-app-id"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-study-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* 3-step instructions */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <li className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <span className="font-semibold text-slate-900 dark:text-white block mb-1">
              1. Save config files in repo
            </span>
            Place <code className="font-study-mono">capacitor.config.json</code> at the root and <code className="font-study-mono">.github/workflows/build-apk.yml</code> in your repository (already included in this project).
          </li>
          <li className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <span className="font-semibold text-slate-900 dark:text-white block mb-1">
              2. Push to GitHub main branch
            </span>
            GitHub Actions automatically installs dependencies, bundles the offline app, and builds <code className="font-study-mono">app-debug.apk</code> using the official Android SDK.
          </li>
          <li className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <span className="font-semibold text-slate-900 dark:text-white block mb-1">
              3. Download APK from Releases
            </span>
            Open your repo&apos;s <strong className="text-slate-900 dark:text-white">Releases</strong> or <strong className="text-slate-900 dark:text-white">Actions</strong> page to download the <code className="font-study-mono">.apk</code> directly from GitHub.
          </li>
        </ol>

        {/* capacitor.config.json */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold font-study-mono text-slate-700 dark:text-slate-300">
              capacitor.config.json
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(capacitorConfig, 'capacitor')}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'capacitor' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'capacitor' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('capacitor.config.json', capacitorConfig)}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-study-mono overflow-x-auto border border-slate-800">
            {capacitorConfig}
          </pre>
        </div>

        {/* .github/workflows/build-apk.yml */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold font-study-mono text-slate-700 dark:text-slate-300">
              .github/workflows/build-apk.yml
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(workflowYaml, 'workflow')}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'workflow' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'workflow' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('build-apk.yml', workflowYaml)}
                className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-study-mono overflow-x-auto max-h-80 border border-slate-800">
            {workflowYaml}
          </pre>
        </div>

        <div className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Everything runs inside your GitHub account. Students&apos; offline reading cache, bookmarks, and completed module progress remain stored locally on their device.
          </span>
        </div>
      </section>
    </div>
  );
};
