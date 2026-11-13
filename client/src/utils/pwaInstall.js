let initialized = false;
let deferredInstallPrompt = null;
let installed = false;
const listeners = new Set();

const notify = () => {
  const state = getPwaInstallState();
  listeners.forEach(listener => listener(state));
};

export const getPwaInstallState = () => ({
  canPrompt: Boolean(deferredInstallPrompt),
  installed,
  isIOS: typeof navigator !== 'undefined'
    && (/iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)),
});

export const subscribeToPwaInstall = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const initializePwa = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch((error) => {
      console.warn('MyConverterTool offline support could not start:', error);
    });
  }

  installed = window.matchMedia?.('(display-mode: standalone)').matches === true
    || navigator.standalone === true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredInstallPrompt = null;
    notify();
  });
};

export const promptPwaInstall = async () => {
  if (!deferredInstallPrompt) return null;
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  notify();

  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  notify();
  return choice.outcome;
};
