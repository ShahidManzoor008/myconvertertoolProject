let pendingScript;

export function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (pendingScript) return pendingScript;

  pendingScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.googleIdentity = 'true';
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      pendingScript = null;
      reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
    };
    const timer = setTimeout(fail, 15000);
    script.onload = () => {
      if (!window.google?.accounts?.id) return fail();
      clearTimeout(timer);
      resolve();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return pendingScript;
}
