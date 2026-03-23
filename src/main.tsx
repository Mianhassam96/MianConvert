import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register COI service worker for FFmpeg SharedArrayBuffer support
// Works on both localhost and GitHub Pages
if (!crossOriginIsolated && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw-coi.js').then(() => {
    if (!sessionStorage.getItem('coi-reloaded')) {
      sessionStorage.setItem('coi-reloaded', '1');
      location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
