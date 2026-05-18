import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// @ts-expect-error - Virtual module generated dynamically by vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Ensure users get fresh bundles quickly and avoid stale cached chunks.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
