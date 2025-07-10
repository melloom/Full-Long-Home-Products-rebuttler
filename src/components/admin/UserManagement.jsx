import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { getAuth } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../services/firebase/config';
import './UserManagement.css';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [userError, setUserError] = useState('');

  useEffect(() => {
    console.log('UserManagement mounted, currentUser:', currentUser);
    if (currentUser) {
      console.log('Current user exists, fetching users...');
      fetchUsers();
    } else {
      console.log('No current user found');
      setError('You must be logged in to view users');
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      console.log('Starting fetchUsers...');
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        console.log('No current user in fetchUsers');
        setError('You must be logged in to view users');
        setLoading(false);
        return;
      }

      console.log('Calling userService.getAllUsers()...');
      const fetchedUsers = await userService.getAllUsers();
      console.log('Fetched users:', fetchedUsers);
      
      if (!fetchedUsers || fetchedUsers.length === 0) {
        console.log('No users found in response');
        setError('No users found. Try creating a new user.');
      } else {
        console.log(`Found ${fetchedUsers.length} users`);
        setUsers(fetchedUsers);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('must be logged in')) {
        setError('You must be logged in to view users');
      } else if (error.message.includes('permission-denied')) {
        setError('You do not have permission to view users. Please contact your administrator.');
      } else {
        setError(`Failed to fetch users: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setUserError('Please enter a valid email address');
      return;
    }

    // Validate passwords match
    if (newUser.password !== newUser.confirmPassword) {
      setUserError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newUser.password.length < 6) {
      setUserError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await userService.createUser(newUser.email, newUser.password, newUser.role);
      setShowAddModal(false);
      setNewUser({ email: '', password: '', confirmPassword: '', role: 'user' });
      await fetchUsers(); // Refresh the user list
      alert('User created successfully! They can now log in with their email and password.');
    } catch (error) {
      console.error('Error adding user:', error);
      if (error.message.includes('must be logged in')) {
        setUserError('You must be logged in to create users');
      } else if (error.message.includes('already registered')) {
        setUserError('This email is already registered');
      } else if (error.message.includes('Invalid email')) {
        setUserError('Please enter a valid email address');
      } else if (error.message.includes('Password should be')) {
        setUserError('Password must be at least 6 characters long');
      } else if (error.message.includes('permission-denied')) {
        setUserError('You do not have permission to create users');
      } else {
        setUserError(error.message || 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log('🔍 UserManagement: Attempting to delete user:', userId);
        console.log('🔍 UserManagement: Current user:', auth.currentUser);
        console.log('🔍 UserManagement: Stored admin user:', localStorage.getItem('adminUser'));
        
        await userService.deleteUser(userId);
        console.log('🔍 UserManagement: User deleted successfully');
        fetchUsers(); // Refresh the user list
      } catch (error) {
        console.error('🔍 UserManagement: Error deleting user:', error);
        console.error('🔍 UserManagement: Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes('must be logged in')) {
          alert('You must be logged in to delete users');
        } else if (error.message.includes('Firebase Auth session required')) {
          alert('Your session has expired. Please log in again to continue.');
        } else if (error.message.includes('permission-denied')) {
          alert('You do not have permission to delete users');
        } else if (error.message.includes('not found')) {
          alert('User not found. They may have already been deleted.');
        } else {
          alert(`Failed to delete user: ${error.message}`);
        }
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      console.log('🔍 UserManagement: Attempting to update user role:', { userId, newRole });
      console.log('🔍 UserManagement: Current user:', auth.currentUser);
      console.log('🔍 UserManagement: Stored admin user:', localStorage.getItem('adminUser'));
      
      await userService.updateUserRole(userId, newRole);
      console.log('🔍 UserManagement: User role updated successfully');
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error('🔍 UserManagement: Error updating user role:', error);
      console.error('🔍 UserManagement: Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
              if (error.message.includes('must be logged in')) {
          alert('You must be logged in to update user roles');
        } else if (error.message.includes('Firebase Auth session required')) {
          alert('Your session has expired. Please log in again to continue.');
        } else if (error.message.includes('permission-denied')) {
          alert('You do not have permission to update user roles');
        } else if (error.message.includes('not found')) {
          alert('User not found. They may have been deleted.');
        } else if (error.message.includes('unavailable')) {
          alert('Service temporarily unavailable. Please try again.');
        } else {
          alert(`Failed to update user role: ${error.message}`);
        }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (user) => {
    // Use the same logic as the stats calculation
    const isActive = user.isActive !== false; // Default to true unless explicitly false
    
    if (!isActive) return <span className="status-badge inactive">Inactive</span>;
    return <span className="status-badge active">Active</span>;
  };

  const getRoleBadge = (role) => {
    return (
      <span className={`role-badge ${role.toLowerCase()}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Debug section - remove this after fixing the issue
  const debugInfo = {
    currentUser: auth.currentUser,
    storedAdminUser: localStorage.getItem('adminUser'),
    usersCount: users.length,
    filteredUsersCount: filteredUsers.length
  };

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h3>Error Loading Users</h3>
            <p>{error}</p>
            <button onClick={fetchUsers} className="retry-button">
              <span>🔄</span> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Debug section - remove after fixing */}
      <div style={{ 
        backgroundColor: '#f0f8ff', 
        border: '1px solid #007acc', 
        borderRadius: '8px', 
        padding: '15px', 
        marginBottom: '20px',
        fontSize: '12px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#007acc' }}>🔍 Debug Info</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <strong>Current User:</strong> {debugInfo.currentUser ? `${debugInfo.currentUser.email} (${debugInfo.currentUser.uid})` : 'None'}
          </div>
          <div>
            <strong>Stored Admin:</strong> {debugInfo.storedAdminUser ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Users Count:</strong> {debugInfo.usersCount}
          </div>
          <div>
            <strong>Filtered Users:</strong> {debugInfo.filteredUsersCount}
          </div>
        </div>
        {!debugInfo.currentUser && debugInfo.storedAdminUser && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
            <strong>⚠️ Session Issue:</strong> You have stored admin data but no active Firebase Auth session. 
            <button 
              onClick={() => window.location.href = '/admin/login'}
              style={{ 
                marginLeft: '10px', 
                padding: '4px 8px', 
                backgroundColor: '#007acc', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              Log In Again
            </button>
          </div>
        )}
      </div>

      <div className="user-management-header">
        <div className="header-left">
          <h2>👥 User Management</h2>
          <p className="header-subtitle">Manage user accounts and permissions</p>
        </div>
        <div className="header-right">
          <button 
            className="add-button"
            onClick={() => setShowAddModal(true)}
          >
            <span>➕</span> Add New User
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => u.role === 'admin').length}</span>
          <span className="stat-label">Admins</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{users.filter(u => {
            // Consider a user active if they exist and don't have explicit inactive flags
            const isActive = u.isActive !== false; // Default to true unless explicitly false
            return isActive;
          }).length}</span>
          <span className="stat-label">Active Users</span>
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <div className="no-users-content">
              <div className="no-users-icon">👤</div>
              <h3>No Users Found</h3>
              <p>{searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Get started by creating your first user account.'}</p>
              {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
                <button 
                  className="add-button"
                  onClick={() => setShowAddModal(true)}
                >
                  <span>➕</span> Create First User
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div key={user.id || user.uid} className="user-card redesigned">
                <div className="user-card-main">
                  <div className="user-avatar big">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-main-info">
                    <div className="user-email redesigned">{user.email}</div>
                    <div className="user-badges redesigned">
                      {getStatusBadge(user)}
                      {getRoleBadge(user.role || 'user')}
                    </div>
                  </div>
                  <div className="user-actions redesigned">
                    <button 
                      className="action-button edit"
                      onClick={() => handleRoleChange(user.id || user.uid, user.role === 'admin' ? 'user' : 'admin')}
                      title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    >
                      {user.role === 'admin' ? <span role="img" aria-label="Remove Admin">👑</span> : <span role="img" aria-label="Make Admin">👤</span>}
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={() => handleDeleteUser(user.id || user.uid)}
                      title="Delete User"
                    >
                      <span role="img" aria-label="Delete">🗑️</span> Delete
                    </button>
                  </div>
                </div>
                <div className="user-card-divider"></div>
                <div className="user-card-meta">
                  <div className="meta-item">
                    <span className="meta-icon" role="img" aria-label="Created">📅</span>
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon" role="img" aria-label="Last Sign In">🕒</span>
                    <span className="meta-label">Last Sign In:</span>
                    <span className="meta-value">{formatDate(user.lastSignIn)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Add New User</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            {userError && (
              <div className="error-message">
                <span>⚠️</span> {userError}
              </div>
            )}
            
            <form onSubmit={handleAddUser} className="add-user-form">
              <div className="form-group">
                <label htmlFor="email">📧 Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter user's email address"
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">🔒 Password</label>
                  <input
                    type="password"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">🔒 Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="role">👤 Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-button"
                  disabled={loading}
                >
                  {loading ? '🔄 Creating...' : '✅ Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 