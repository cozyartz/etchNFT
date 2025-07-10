'use client';
import React, { useState, useEffect } from 'react';
import { User, Shield, Plus, Edit, Trash2, Search, Filter, Activity } from 'lucide-react';

interface User {
  id: string;
  email: string;
  github_id: string;
  status: 'active' | 'suspended' | 'inactive';
  roles: string;
  last_login: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user_email?: string;
  user_github_id?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchAuditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
    } catch (err) {
      setError('Failed to fetch roles');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit');
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (err) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });
      
      if (response.ok) {
        fetchUsers();
        setShowAssignRole(false);
      } else {
        setError('Failed to assign role');
      }
    } catch (err) {
      setError('Failed to assign role');
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles?roleId=${roleId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchUsers();
      } else {
        setError('Failed to remove role');
      }
    } catch (err) {
      setError('Failed to remove role');
    }
  };

  const createRole = async (name: string, description: string, selectedPermissions: string[]) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions: selectedPermissions })
      });
      
      if (response.ok) {
        fetchRoles();
        setShowCreateRole(false);
      } else {
        setError('Failed to create role');
      }
    } catch (err) {
      setError('Failed to create role');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.github_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.roles?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
            }`}
          >
            <User className="inline mr-2" size={16} />
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'roles' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
            }`}
          >
            <Shield className="inline mr-2" size={16} />
            Roles
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'audit' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
            }`}
          >
            <Activity className="inline mr-2" size={16} />
            Audit
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowCreateRole(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={16} />
              Create Role
            </button>
          </div>

          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-white">User</th>
                  <th className="px-4 py-3 text-left text-white">Roles</th>
                  <th className="px-4 py-3 text-left text-white">Status</th>
                  <th className="px-4 py-3 text-left text-white">Last Login</th>
                  <th className="px-4 py-3 text-left text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-zinc-700">
                    <td className="px-4 py-3 text-white">
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-gray-400">@{user.github_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.roles || 'No roles'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignRole(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 mr-2"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div key={role.id} className="bg-zinc-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                  {role.is_system && (
                    <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">
                      System
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">{role.description}</p>
                {!role.is_system && (
                  <div className="flex gap-2">
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      Edit
                    </button>
                    <button className="text-red-400 hover:text-red-300 text-sm">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-white">User</th>
                  <th className="px-4 py-3 text-left text-white">Action</th>
                  <th className="px-4 py-3 text-left text-white">Resource</th>
                  <th className="px-4 py-3 text-left text-white">Time</th>
                  <th className="px-4 py-3 text-left text-white">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-b border-zinc-700">
                    <td className="px-4 py-3 text-white">
                      <div className="text-sm">
                        {log.user_email || log.user_github_id || log.user_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{log.action}</td>
                    <td className="px-4 py-3 text-gray-300">{log.resource}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showAssignRole && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Assign Role to {selectedUser.email}
            </h3>
            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => assignRole(selectedUser.id, role.id)}
                  className="w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition"
                >
                  <div className="font-medium">{role.name}</div>
                  <div className="text-sm text-gray-400">{role.description}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAssignRole(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}