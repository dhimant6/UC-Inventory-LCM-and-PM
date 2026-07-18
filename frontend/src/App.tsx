import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { HomeIcon, DevicePhoneMobileIcon, UserGroupIcon, ClipboardDocumentListIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';
import PhoneManagement from './components/PhoneManagement';
import DevicesManagement from './components/DevicesManagement';
import TeamsManagement from './components/TeamsManagement';
import ProjectsManagement from './components/ProjectsManagement';
import TimeTrackingManagement from './components/TimeTrackingManagement';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link to={to} className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
    <Icon className="w-5 h-5 mr-3" />
    <span className="font-medium">{label}</span>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    devices: 0,
    teams: 0,
    phoneNumbers: 0,
    projects: 0,
    timeEntries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch all stats in parallel
        const [devicesRes, teamsRes, phonesRes, projectsRes, timeEntriesRes] = await Promise.all([
          fetch('/api/devices'),
          fetch('/api/teams'),
          fetch('/api/phones'),
          fetch('/api/projects'),
          fetch('/api/time-entries')
        ]);

        const [devicesData, teamsData, phonesData, projectsData, timeEntriesData] = await Promise.all([
          devicesRes.json(),
          teamsRes.json(),
          phonesRes.json(),
          projectsRes.json(),
          timeEntriesRes.json()
        ]);

        setStats({
          devices: Array.isArray(devicesData) ? devicesData.length : 0,
          teams: Array.isArray(teamsData) ? teamsData.length : 0,
          phoneNumbers: Array.isArray(phonesData) ? phonesData.length : 0,
          projects: Array.isArray(projectsData) ? projectsData.length : 0,
          timeEntries: Array.isArray(timeEntriesData) ? timeEntriesData.length : 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Set fallback values if API calls fail
        setStats({
          devices: 0,
          teams: 0,
          phoneNumbers: 0,
          projects: 0,
          timeEntries: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">UC Inventory Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">UC Inventory Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Devices</h2>
              <p className="text-2xl font-bold text-blue-600">{stats.devices}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Teams</h2>
              <p className="text-2xl font-bold text-green-600">{stats.teams}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <PhoneIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Phone Numbers</h2>
              <p className="text-2xl font-bold text-purple-600">{stats.phoneNumbers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
              <p className="text-2xl font-bold text-orange-600">{stats.projects}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Time Entries</h2>
              <p className="text-2xl font-bold text-red-600">{stats.timeEntries}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            to="/devices"
            className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors text-center"
          >
            <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-800">Manage Devices</span>
          </Link>
          <Link 
            to="/teams"
            className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors text-center"
          >
            <UserGroupIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-800">Manage Teams</span>
          </Link>
          <Link 
            to="/phones"
            className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg transition-colors text-center"
          >
            <PhoneIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-800">Manage Phones</span>
          </Link>
          <Link 
            to="/projects"
            className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg transition-colors text-center"
          >
            <ClipboardDocumentListIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-800">Manage Projects</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-800">UC Inventory</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <NavItem to="/" icon={HomeIcon} label="Dashboard" />
                <NavItem to="/devices" icon={DevicePhoneMobileIcon} label="Devices" />
                <NavItem to="/teams" icon={UserGroupIcon} label="Teams" />
                <NavItem to="/phones" icon={PhoneIcon} label="Phones" />
                <NavItem to="/projects" icon={ClipboardDocumentListIcon} label="Projects" />
                <NavItem to="/time-tracking" icon={ClockIcon} label="Time Tracking" />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<DevicesManagement />} />
            <Route path="/teams" element={<TeamsManagement />} />
            <Route path="/phones" element={<PhoneManagement />} />
            <Route path="/projects" element={<ProjectsManagement />} />
            <Route path="/time-tracking" element={<TimeTrackingManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
