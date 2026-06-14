import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneIcon, UserIcon, PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Phone {
  id: string;
  number: string;
  type: 'mobile' | 'landline' | 'voip';
  teamId: string;
  assignedTo?: string;
  status: 'active' | 'inactive' | 'reserved';
  purchaseDate: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  id: string;
  name: string;
  department: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  teamId?: string;
}

const PhoneManagement = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    type: 'mobile',
    teamId: '',
    assignedTo: '',
    status: 'active',
    purchaseDate: '',
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phones');
      if (response.ok) {
        const data = await response.json();
        setPhones(data);
      }

      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);
      }

      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/phones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPhone = await response.json();
        setPhones([...phones, newPhone]);
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating phone:', error);
    }
  };

  const handleUpdate = async (phoneId: string, updates: Partial<Phone>) => {
    try {
      const response = await fetch(`/api/phones/${phoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedPhone = await response.json();
        setPhones(phones.map(p => p.id === phoneId ? updatedPhone : p));
      }
    } catch (error) {
      console.error('Error updating phone:', error);
    }
  };

  const handleDelete = async (phoneId: string) => {
    try {
      const response = await fetch(`/api/phones/${phoneId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPhones(phones.filter(p => p.id !== phoneId));
      }
    } catch (error) {
      console.error('Error deleting phone:', error);
    }
  };

  const handleAssign = async (phoneId: string, userId: string) => {
    try {
      const response = await fetch('/api/phones/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneId, userId }),
      });

      if (response.ok) {
        const updatedPhone = await response.json();
        setPhones(phones.map(p => p.id === phoneId ? updatedPhone : p));
      }
    } catch (error) {
      console.error('Error assigning phone:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      type: 'mobile',
      teamId: '',
      assignedTo: '',
      status: 'active',
      purchaseDate: '',
      expiryDate: '',
      notes: ''
    });
    setSelectedPhone(null);
  };

  const openEditModal = (phone: Phone) => {
    setSelectedPhone(phone);
    setFormData({
      number: phone.number,
      type: phone.type,
      teamId: phone.teamId,
      assignedTo: phone.assignedTo || '',
      status: phone.status,
      purchaseDate: phone.purchaseDate,
      expiryDate: phone.expiryDate || '',
      notes: phone.notes || ''
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Phone Number Management</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Phone
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {phones.map((phone) => (
            <motion.div
              key={phone.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{phone.number}</h3>
                  <p className="text-sm text-gray-600">{phone.type}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${phone.status === 'active' ? 'bg-green-100 text-green-800' :
                    phone.status === 'inactive' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'}`}
                >
                  {phone.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Team: {teams.find(t => t.id === phone.teamId)?.name || 'Unknown'}
                </div>
                {phone.assignedTo && (
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Assigned to: {users.find(u => u.id === phone.assignedTo)?.name || 'Unknown'}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  Purchased: {new Date(phone.purchaseDate).toLocaleDateString()}
                </div>
              </div>

              <div className="flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openEditModal(phone)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(phone.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {phones.length === 0 && (
        <div className="text-center py-12">
          <PhoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No phone numbers found</h3>
          <p className="text-gray-500">Add your first phone number to get started</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">
              {selectedPhone ? 'Edit Phone' : 'Add New Phone'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mobile">Mobile</option>
                  <option value="landline">Landline</option>
                  <option value="voip">VoIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({...formData, teamId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {selectedPhone ? 'Update' : 'Create'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PhoneManagement;
