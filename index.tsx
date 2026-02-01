import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Application Failed to Start:", error);
  rootElement.innerHTML = `<div style="color: #ef4444; padding: 2rem; font-family: sans-serif;">
    <h1>System Error</h1>
    <p>Failed to initialize operator console.</p>
    <pre style="background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; overflow: auto;">
      ${error instanceof Error ? error.message : String(error)}
    </pre>
  </div>`;
}