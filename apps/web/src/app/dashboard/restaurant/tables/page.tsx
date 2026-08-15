'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, LayoutDashboard } from 'lucide-react';
import api from '@/lib/api';

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  tableType: 'VIP' | 'Normal';
  status: 'Available' | 'Reserved' | 'Occupied' | 'Disabled';
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState('');
  
  // Form State
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
          fetchTables(profileRes.data._id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      resetForm();
      fetchTables(restaurantId);
    } catch (error) {
      console.error('Error saving table', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading tables...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="text-purple-400" />
            Table Management
          </h1>
          <p className="text-zinc-400 mt-2">Manage your venue's table inventory for reservations.</p>
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
          <h2 className="text-xl font-semibold text-white mb-4">
            {editingId ? 'Edit Table' : 'Add New Table'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Table Number/Name</label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. T-1, VIP Lounge"
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

      {tables.length === 0 && !isFormOpen ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl">
          <LayoutDashboard className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">No tables found</h3>
          <p className="text-zinc-400 mb-4">Add your first table to start accepting reservations.</p>
          <Button onClick={() => setIsFormOpen(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white">
            Add Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(table => (
            <div key={table._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{table.tableNumber}</h3>
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
  );
}
