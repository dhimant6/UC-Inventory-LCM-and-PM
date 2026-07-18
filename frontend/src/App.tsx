import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/shell';
import { ThemeProvider } from './lib/theme';
import ActivityPage from './pages/ActivityPage';
import ConnectorsPage from './pages/ConnectorsPage';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import LicensesPage from './pages/LicensesPage';
import NotFoundPage from './pages/NotFoundPage';
import NumbersPage from './pages/NumbersPage';
import ProjectsPage from './pages/ProjectsPage';
import SitesPage from './pages/SitesPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppShell>
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
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
