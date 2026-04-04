
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { router } from './router';
import ErrorBoundary from './components/ui/ErrorBoundary';
import OfflineBanner from './components/ui/OfflineBanner';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <OfflineBanner />
          <RouterProvider router={router} />
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
