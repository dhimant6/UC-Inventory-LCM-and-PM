import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell';
import { TableSkeleton } from './components/ui';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';

// Route-level code splitting: each page (and its chart/3D deps) loads on demand.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const NumbersPage = lazy(() => import('./pages/NumbersPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SitesPage = lazy(() => import('./pages/SitesPage'));
const LicensesPage = lazy(() => import('./pages/LicensesPage'));
const ConnectorsPage = lazy(() => import('./pages/ConnectorsPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
        <AppShell>
          <Suspense fallback={<TableSkeleton rows={10} />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/numbers" element={<NumbersPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/licenses" element={<LicensesPage />} />
              <Route path="/connectors" element={<ConnectorsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
