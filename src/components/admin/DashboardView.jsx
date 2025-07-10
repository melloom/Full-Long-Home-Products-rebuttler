import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import './DashboardView.css';

const DashboardView = () => {
  const [stats, setStats] = useState({
    totalRebuttals: 0,
    totalCategories: 0,
    totalDispositions: 0,
    totalUsers: 0,
    recentActivity: [],
    topCategories: [],
    systemHealth: 'Good'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      
      // Fetch basic counts
      const rebuttalsSnapshot = await getDocs(collection(db, 'rebuttals'));
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const dispositionsSnapshot = await getDocs(collection(db, 'dispositions'));
      const usersSnapshot = await getDocs(collection(db, 'users'));

      // Get recent activity (last 5 rebuttals)
      const recentRebuttalsQuery = query(
        collection(db, 'rebuttals'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSnapshot = await getDocs(recentRebuttalsQuery);

      const recentActivity = recentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'rebuttal'
      }));

      // Calculate top categories
      const categoryCounts = {};
      rebuttalsSnapshot.docs.forEach(doc => {
        const category = doc.data().category;
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalRebuttals: rebuttalsSnapshot.size,
        totalCategories: categoriesSnapshot.size,
        totalDispositions: dispositionsSnapshot.size,
        totalUsers: usersSnapshot.size,
        recentActivity,
        topCategories,
        systemHealth: 'Good'
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats(prev => ({ ...prev, systemHealth: 'Error' }));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Overview</h1>
          <p>Welcome to your admin dashboard. Here's what's happening with your system.</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchDashboardData}>
            <span>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Total Rebuttals</h3>
            <div className="stat-number">{stats.totalRebuttals}</div>
            <div className="stat-label">Active responses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>Categories</h3>
            <div className="stat-number">{stats.totalCategories}</div>
            <div className="stat-label">Organized groups</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Dispositions</h3>
            <div className="stat-number">{stats.totalDispositions}</div>
            <div className="stat-label">Lead outcomes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Users</h3>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Registered users</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>📈 Recent Activity</h2>
            <span className="card-subtitle">Latest rebuttals added</span>
          </div>
          <div className="activity-list">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((item, index) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon">📝</div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {item.summary || item.objection || 'Untitled Rebuttal'}
                    </div>
                    <div className="activity-meta">
                      <span className="activity-category">{item.category || 'Uncategorized'}</span>
                      <span className="activity-date">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>No recent activity</p>
                <span>New rebuttals will appear here</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>🏆 Top Categories</h2>
            <span className="card-subtitle">Most used categories</span>
          </div>
          <div className="categories-list">
            {stats.topCategories.length > 0 ? (
              stats.topCategories.map((category, index) => (
                <div key={category.name} className="category-item">
                  <div className="category-rank">#{index + 1}</div>
                  <div className="category-content">
                    <div className="category-name">{category.name}</div>
                    <div className="category-count">{category.count} rebuttals</div>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-progress" 
                      style={{ 
                        width: `${(category.count / Math.max(...stats.topCategories.map(c => c.count))) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏷️</div>
                <p>No categories yet</p>
                <span>Categories will appear here</span>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>⚡ System Status</h2>
            <span className="card-subtitle">Current system health</span>
          </div>
          <div className="system-status">
            <div className={`status-indicator ${stats.systemHealth.toLowerCase()}`}>
              <div className="status-dot"></div>
              <span className="status-text">{stats.systemHealth}</span>
            </div>
            <div className="status-details">
              <div className="status-item">
                <span className="status-label">Database</span>
                <span className="status-value">Connected</span>
              </div>
              <div className="status-item">
                <span className="status-label">Authentication</span>
                <span className="status-value">Active</span>
              </div>
              <div className="status-item">
                <span className="status-label">Storage</span>
                <span className="status-value">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>🚀 Quick Actions</h2>
            <span className="card-subtitle">Common admin tasks</span>
          </div>
          <div className="quick-actions">
            <button className="action-btn primary">
              <span className="action-icon">➕</span>
              <div className="action-content">
                <strong>Add Rebuttal</strong>
                <span>Create new response</span>
              </div>
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">🏷️</span>
              <div className="action-content">
                <strong>Manage Categories</strong>
                <span>Organize content</span>
              </div>
            </button>
            <button className="action-btn tertiary">
              <span className="action-icon">📊</span>
              <div className="action-content">
                <strong>View Analytics</strong>
                <span>Performance data</span>
              </div>
            </button>
            <button className="action-btn quaternary">
              <span className="action-icon">⚙️</span>
              <div className="action-content">
                <strong>Settings</strong>
                <span>Configure system</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView; 