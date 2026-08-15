'use client';

import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Plus, Edit2, Trash2, LayoutDashboard, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  tableType: 'VIP' | 'Normal';
  status: 'Available' | 'Reserved' | 'Occupied' | 'Disabled';
}

export default function VenueProfilePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState('');
  const [profileData, setProfileData] = useState({
    restaurantName: '',
    description: '',
    address: '',
    city: '',
    contactDetails: '',
    logo: ''
  });
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveProfileMessage, setSaveProfileMessage] = useState({ text: '', type: '' });
  
  // Table Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [tableType, setTableType] = useState<'VIP' | 'Normal'>('Normal');
  const [status, setStatus] = useState<'Available' | 'Reserved' | 'Occupied' | 'Disabled'>('Available');

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await api.get('/profile/me');
        if (profileRes.data && profileRes.data._id) {
          setRestaurantId(profileRes.data._id);
          setProfileData({
            restaurantName: profileRes.data.restaurantName || '',
            description: profileRes.data.description || profileRes.data.cuisine?.join(', ') || '',
            address: profileRes.data.address || '',
            city: profileRes.data.user?.city || '',
            contactDetails: profileRes.data.contactDetails || '',
            logo: profileRes.data.logo || ''
          });
          fetchTables(profileRes.data._id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile', error);
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchTables = async (rId: string) => {
    try {
      const res = await api.get(`/tables/restaurant/${rId}`);
      setTables(res.data);
    } catch (error) {
      console.error('Error fetching tables', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTableNumber('');
    setCapacity('');
    setTableType('Normal');
    setStatus('Available');
  };

  const handleEdit = (table: Table) => {
    setEditingId(table._id);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity.toString());
    setTableType(table.tableType);
    setStatus(table.status);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables(restaurantId);
    } catch (error) {
      console.error('Error deleting table', error);
    }
  };

  const [tableError, setTableError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTableError('');

    if (!restaurantId) {
      setTableError('Please save your General Information profile first to register your venue.');
      return;
    }
    
    try {
      const payload = {
        restaurant: restaurantId,
        tableNumber,
        capacity: Number(capacity),
        tableType,
        status
      };
      
      if (editingId) {
        await api.put(`/tables/${editingId}`, payload);
      } else {
        await api.post('/tables', payload);
      }
      
      // Wait for tables to refresh before closing the form
      await fetchTables(restaurantId);
      resetForm();
    } catch (error: any) {
      console.error('Error saving table', error);
      setTableError(error.response?.data?.message || 'Failed to save table');
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setSaveProfileMessage({ text: '', type: '' });
    try {
      const res = await api.put('/profile/update', profileData);
      if (res.data && res.data._id) {
        setRestaurantId(res.data._id);
      }
      setSaveProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setSaveProfileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Failed to update profile', error);
      setSaveProfileMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Venue Profile</h1>
        <p className="text-zinc-400 mt-1">Manage your public appearance and table layout.</p>
      </div>

      {/* General Information Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">General Information</h2>
          <Button 
            onClick={handleProfileSave} 
            disabled={savingProfile || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <Save size={16} />
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {saveProfileMessage.text && (
          <div className={`p-4 rounded-lg border mb-4 ${
            saveProfileMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {saveProfileMessage.text}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div 
            className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 overflow-hidden shrink-0 bg-cover bg-center"
            style={profileData.logo ? { backgroundImage: `url(${profileData.logo})` } : {}}
          >
            {!profileData.logo && <Store size={32} className="text-zinc-500" />}
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Upload Logo</label>
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
                    setSaveProfileMessage({ text: 'Unsupported image format. Please upload a standard JPEG or PNG image.', type: 'error' });
                    e.target.value = '';
                    return;
                  }
                  setSaveProfileMessage({ text: '', type: '' });
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setProfileData(prev => ({ ...prev, logo: (reader.result as string) || '' }));
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-colors"
            />
            <p className="text-xs text-zinc-500">Recommended: Square image, max 2MB (JPEG, PNG).</p>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Venue Name</label>
            <input
              type="text"
              name="restaurantName"
              value={profileData.restaurantName || ''}
              onChange={handleProfileChange}
              placeholder="Not specified"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Description / Cuisine</label>
            <textarea
              rows={4}
              name="description"
              value={profileData.description || ''}
              onChange={handleProfileChange}
              placeholder="Not specified"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Location / Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="address"
                  value={profileData.address || ''}
                  onChange={handleProfileChange}
                  placeholder="Not specified"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">City</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="city"
                  value={profileData.city || ''}
                  onChange={handleProfileChange}
                  placeholder="e.g. Bhubaneswar"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={16} className="text-zinc-500" />
                </div>
                <input
                  type="text"
                  name="contactDetails"
                  value={profileData.contactDetails || ''}
                  onChange={handleProfileChange}
                  placeholder="Not specified"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 pl-10 pr-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Management Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="text-purple-400" size={20} />
              Tables & Seating
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Customers will see and book these tables for your events.</p>
          </div>
          {!isFormOpen && (
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Plus size={16} />
              Add Table
            </Button>
          )}
        </div>

        {isFormOpen && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Table' : 'Add New Table'}
            </h3>
            {tableError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md">
                {tableError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Table Name/No.</label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. VIP-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. 4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
                  <select
                    value={tableType}
                    onChange={(e) => setTableType(e.target.value as any)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {editingId ? 'Update' : 'Save'} Table
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-zinc-400">Loading tables...</div>
        ) : tables.length === 0 && !isFormOpen ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl">
            <LayoutDashboard className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No tables found</h3>
            <p className="text-zinc-400 mb-4">Add your first table to let customers make reservations.</p>
            <Button onClick={() => setIsFormOpen(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white">
              Add Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {tables.map(table => (
              <div key={table._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{table.tableNumber}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-zinc-400">Seats: {table.capacity}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${table.tableType === 'VIP' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-300'}`}>
                        {table.tableType}
                      </span>
                    </div>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(table)} className="p-1.5 text-zinc-400 hover:text-purple-400">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(table._id)} className="p-1.5 text-zinc-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800/50">
                  <div className={`w-2 h-2 rounded-full ${
                    table.status === 'Available' ? 'bg-green-500' : 
                    table.status === 'Reserved' ? 'bg-blue-500' : 
                    table.status === 'Occupied' ? 'bg-amber-500' : 'bg-zinc-600'
                  }`} />
                  <span className="text-sm text-zinc-300">{table.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
