'use client';

import { useEffect, useState } from 'react';
import { Loader2, Trash2, Edit, Save, X, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Failed to delete user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user._id);
    setEditForm({ ...user });
    setNewPassword('');
  };

  const handleSave = async (id: string) => {
    try {
      const payload = { ...editForm };
      if (newPassword) {
        payload.password = newPassword;
      }
      
      const res = await api.put(`/admin/users/${id}`, payload);
      setUsers(users.map(u => (u._id === id ? { ...u, ...res.data } : u)));
      setEditingId(null);
      setNewPassword('');
    } catch (err) {
      console.error('Failed to update user', err);
      alert('Failed to update user');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setNewPassword('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Users</h1>
        <p className="text-zinc-400 mt-1">View, edit, or delete platform users.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-sm">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">City</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user) => {
              const isEditing = editingId === user._id;
              
              return (
                <tr key={user._id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                      />
                    ) : (
                      <span className="text-white font-medium">{user.name}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <input 
                        type="email" 
                        value={editForm.email} 
                        onChange={e => setEditForm({...editForm, email: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                      />
                    ) : (
                      <span className="text-zinc-300">{user.email}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <select 
                        value={editForm.role} 
                        onChange={e => setEditForm({...editForm, role: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                      >
                        <option value="customer">Customer</option>
                        <option value="restaurant">Restaurant (Venue)</option>
                        <option value="performer">Performer</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-400' :
                        user.role === 'restaurant' ? 'bg-green-500/10 text-green-400' :
                        user.role === 'performer' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.city || ''} 
                        onChange={e => setEditForm({...editForm, city: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                        placeholder="City"
                      />
                    ) : (
                      <span className="text-zinc-400">{user.city || '-'}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {isEditing ? (
                      <div className="flex justify-end items-center gap-2">
                        <div className="relative">
                          <input 
                            type="password" 
                            placeholder="New Password (optional)"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-white text-sm w-40"
                          />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => handleSave(user._id)} className="h-8 w-8 text-green-400 border-green-500/30 hover:bg-green-500/10">
                          <Save size={14} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleCancel} className="h-8 w-8 text-zinc-400 border-zinc-700 hover:bg-zinc-800">
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10">
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(user._id)} className="h-8 w-8 text-red-400 border-red-500/30 hover:bg-red-500/10" disabled={user.role === 'admin'}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
