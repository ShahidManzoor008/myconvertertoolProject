import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, MoreVertical, Share, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { getPwaInstallState, promptPwaInstall, subscribeToPwaInstall } from '../utils/pwaInstall';

const DISMISSED_UNTIL_KEY = 'myconvertertool.installPromptDismissedUntil';
const DISMISS_DAYS = 30;

const wasRecentlyDismissed = () => {
  try { return Number(localStorage.getItem(DISMISSED_UNTIL_KEY)) > Date.now(); }
  catch { return false; }
};

const rememberDismissal = () => {
  try { localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)); }
  catch { /* The prompt remains dismissible for this page session. */ }
};

const InstallInstructions = ({ isIOS }) => (
  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left text-sm leading-6 text-slate-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-slate-200">
    <p className="font-bold text-slate-900 dark:text-white">Add it from your browser menu</p>
    {isIOS ? (
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Tap your browser&apos;s Share button <Share aria-hidden="true" className="inline h-4 w-4 align-text-bottom" />.</li>
        <li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li>
      </ol>
    ) : (
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Open the browser menu <MoreVertical aria-hidden="true" className="inline h-4 w-4 align-text-bottom" />.</li>
        <li>Choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
      </ol>
    )}
  </div>
);
InstallInstructions.propTypes = { isIOS: PropTypes.bool.isRequired };

export default function PwaInstallPrompt() {
  const { pathname } = useLocation();
  const [installState, setInstallState] = useState(getPwaInstallState);
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  const dismiss = useCallback(() => {
    rememberDismissal();
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!installState.canPrompt) {
      setShowInstructions(value => !value);
      return;
    }

    setInstalling(true);
    try {
      const outcome = await promptPwaInstall();
      if (outcome === 'accepted') setVisible(false);
      else if (outcome === 'dismissed') dismiss();
    } catch (error) {
      console.warn('The app installation prompt could not be opened:', error);
    } finally {
      setInstalling(false);
    }
  }, [dismiss, installState.canPrompt]);

  useEffect(() => subscribeToPwaInstall(setInstallState), []);

  useEffect(() => {
    const openInstallPrompt = () => {
      if (installState.canPrompt) {
        void install();
      } else {
        setVisible(true);
        setShowInstructions(true);
      }
    };
    window.addEventListener('myconvertertool:open-install', openInstallPrompt);
    return () => window.removeEventListener('myconvertertool:open-install', openInstallPrompt);
  }, [install, installState.canPrompt]);

  useEffect(() => {
    if (installState.installed || wasRecentlyDismissed() || (!installState.canPrompt && !installState.isIOS)) {
      setVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), 4500);
    return () => window.clearTimeout(timer);
  }, [installState.canPrompt, installState.installed, installState.isIOS]);

  if (installState.installed || !visible || /^\/(?:admin|profile|login|register)(?:\/|$)/.test(pathname)) return null;

  return (
    <aside
      aria-label="Install MyConverterTool"
      className="fixed inset-x-3 z-[200] mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900 sm:inset-x-auto sm:left-5 sm:mx-0"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        <img src="/assets/android-chrome-192x192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-950 dark:text-white">Take MyConverterTool with you</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Install the app for quick access. File conversions still need internet.</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Not now" className="-mr-2 -mt-2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      {showInstructions && <InstallInstructions isIOS={installState.isIOS} />}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={dismiss} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Not now</button>
        <button type="button" onClick={install} disabled={installing} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
          <Download aria-hidden="true" size={16} />
          {installing ? 'Opening…' : installState.canPrompt ? 'Install app' : showInstructions ? 'Hide steps' : 'How to install'}
        </button>
      </div>
    </aside>
  );
}
