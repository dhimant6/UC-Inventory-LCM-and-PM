import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, DevicePhoneIcon, UserGroupIcon, ClipboardDocumentListIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';
import PhoneManagement from './components/PhoneManagement';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <Link to={to} className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
    <Icon className="w-5 h-5 mr-3" />
    <span className="font-medium">{label}</span>
  </Link>
);

const Dashboard = () => {
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
              <DevicePhoneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Devices</h2>
              <p className="text-2xl font-bold text-blue-600">0</p>
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
              <p className="text-2xl font-bold text-green-600">0</p>
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
              <p className="text-2xl font-bold text-purple-600">0</p>
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
              <p className="text-2xl font-bold text-orange-600">0</p>
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
              <p className="text-2xl font-bold text-red-600">0</p>
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
            <DevicePhoneIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
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
                  <DevicePhoneIcon className="w-8 h-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-800">UC Inventory</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <NavItem to="/" icon={HomeIcon} label="Dashboard" />
                <NavItem to="/devices" icon={DevicePhoneIcon} label="Devices" />
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
            <Route path="/devices" element={<div>Devices Page</div>} />
            <Route path="/teams" element={<div>Teams Page</div>} />
            <Route path="/phones" element={<PhoneManagement />} />
            <Route path="/projects" element={<div>Projects Page</div>} />
            <Route path="/time-tracking" element={<div>Time Tracking Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
