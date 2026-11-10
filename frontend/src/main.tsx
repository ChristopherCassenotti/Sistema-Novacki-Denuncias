import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PublicReportDraftProvider } from './context/PublicReportDraftContext';
import { ReporterProvider } from './context/ReporterContext';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
      <PublicReportDraftProvider>
        <ReporterProvider>
          <App />
        </ReporterProvider>
      </PublicReportDraftProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
