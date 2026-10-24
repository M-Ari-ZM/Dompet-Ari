/**
 * PWA Service Worker Registration
 * Registers sw.js when supported by the browser.
 * Shows a subtle update notification if a new SW version is waiting.
 */

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: './'
      });

      console.log('[PWA] Service Worker registered, scope:', registration.scope);

      // Listen for updates (new SW waiting to activate)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // A new version is ready — show a toast notification
            showUpdateToast();
          }
        });
      });
    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  });
}

/**
 * Shows a non-intrusive "Update available" toast at the bottom of the screen.
 */
function showUpdateToast() {
  const existing = document.getElementById('pwa-update-toast');
  if (existing) return;

  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  toast.innerHTML = `
    <span>✨ Versi baru tersedia!</span>
    <button id="pwa-reload-btn">Perbarui</button>
    <button id="pwa-dismiss-btn">✕</button>
  `;
  toast.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: #1a2744; color: #ffffff; padding: 12px 16px; border-radius: 10px;
    display: flex; align-items: center; gap: 12px; font-family: "Plus Jakarta Sans", sans-serif;
    font-size: 0.85rem; font-weight: 600; z-index: 9999; box-shadow: 0 8px 24px rgba(26,39,68,0.3);
    animation: slideUp 300ms ease;
  `;

  document.body.appendChild(toast);

  document.getElementById('pwa-reload-btn').onclick = () => window.location.reload();
  document.getElementById('pwa-dismiss-btn').onclick = () => toast.remove();
}
