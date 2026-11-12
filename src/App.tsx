import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import { AlertTriangle } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PatternExplorer = lazy(() => import('./pages/PatternExplorer'));
const PatternDetail = lazy(() => import('./pages/PatternDetail'));
const RevisionCenter = lazy(() => import('./pages/RevisionCenter'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

function AppRoutes() {
  const { state } = useApp();

  if (state.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0 p-4">
        <div className="card p-8 max-w-md text-center space-y-4 border-red-500/30">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="text-lg font-semibold text-text-primary">Curriculum Error</h2>
          <p className="text-xs text-text-secondary">{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<p className="p-6 text-sm text-text-secondary" role="status">Loading section…</p>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patterns" element={<PatternExplorer />} />
        <Route path="/patterns/:patternId" element={<PatternDetail />} />
        <Route path="/revisions" element={<RevisionCenter />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
