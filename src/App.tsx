import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PatternExplorer from './pages/PatternExplorer';
import PatternDetail from './pages/PatternDetail';
import RevisionCenter from './pages/RevisionCenter';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { AlertTriangle } from 'lucide-react';

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
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patterns" element={<PatternExplorer />} />
        <Route path="/patterns/:patternId" element={<PatternDetail />} />
        <Route path="/revisions" element={<RevisionCenter />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
