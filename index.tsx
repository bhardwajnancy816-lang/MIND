
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Prevent benign dev-server WebSocket and Vite HMR connection errors from showing up as unhandled promise rejections or app crashes
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason);
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('vite') ||
      msg.includes('Vite') ||
      msg.includes('HMR')
    ) {
      console.warn('[Benign Dev Connection Error Intercepted]:', msg);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('vite') ||
      msg.includes('Vite') ||
      msg.includes('HMR')
    ) {
      console.warn('[Benign Dev Error Intercepted]:', msg);
      event.preventDefault();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
