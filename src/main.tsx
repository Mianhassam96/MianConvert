import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

function mount() {
  createRoot(document.getElementById("root")!).render(<App />);
}

// COI service worker needed for FFmpeg SharedArrayBuffer on GitHub Pages.
// Only register if not already isolated. If we need to reload, do it before mounting.
if (!crossOriginIsolated && 'serviceWorker' in navigator) {
  if (sessionStorage.getItem('coi-reloaded')) {
    // Already reloaded once — just mount regardless to avoid infinite loop
    mount();
  } else {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw-coi.js')
      .then((reg) => {
        if (reg.active) {
          // SW already active, reload to apply COOP/COEP headers
          sessionStorage.setItem('coi-reloaded', '1');
          location.reload();
        } else {
          // SW installing for first time — wait then reload
          reg.installing?.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              sessionStorage.setItem('coi-reloaded', '1');
              location.reload();
            }
          });
          // Fallback: mount anyway after 3s if SW never activates
          setTimeout(mount, 3000);
        }
      })
      .catch(() => mount()); // SW failed — mount anyway
  }
} else {
  // Already cross-origin isolated or SW not supported — just mount
  mount();
}
