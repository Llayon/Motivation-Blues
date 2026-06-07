import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { initTelegramApp } from './lib/telegramApp';
import { registerServiceWorker } from './lib/registerServiceWorker';

// Initialize Telegram Mini App environment if running inside Telegram
void initTelegramApp();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
