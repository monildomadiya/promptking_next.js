import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'

// Dismiss the HTML splash screen after React has rendered
function hideSplash() {
  const splash = document.getElementById('app-splash');
  if (splash) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        splash.classList.add('splash-hidden');
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
      }, 200);
    });
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
  hideSplash();
}
