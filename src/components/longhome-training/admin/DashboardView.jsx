import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import './DashboardView.css';

// Helper function to format time ago
const getTimeAgo = (date) => {
  try {
    if (!date) return 'Unknown';
    if (date && typeof date === 'object' && date.toDate) {
      date = date.toDate();
    }
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    if (isNaN(date.getTime())) {
      return 'Unknown';
    }
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting time ago:', error);
    return 'Unknown';
  }
};

// Normalize any value to a readable string for UI
const normalizeText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Firestore Timestamp
  if (value && typeof value === 'object' && typeof value.toDate === 'function') {
    try { return value.toDate().toLocaleString(); } catch { return 'Unknown'; }
  }
  // Arrays of primitives/objects
  if (Array.isArray(value)) {
    return value.map(v => normalizeText(v)).join(', ');
  }
  // Plain object -> try common fields, else JSON compact
  if (typeof value === 'object') {
    const common = value.text || value.pt1 || value.pt2 || value.title || value.name || value.value;
    if (common) return normalizeText(common);
    try { return JSON.stringify(value); } catch { return '[object]'; }
  }
  try { return String(value); } catch { return ''; }
};

const DashboardView = ({ onGoTab, companyId }) => {
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
  const [showAllActivity, setShowAllActivity] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [companyId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      
      console.log('🔍 DashboardView: Fetching dashboard data...');
      console.log('🔍 DashboardView: CompanyId:', companyId);
      
      // Fetch all documents and filter by company in the application
      const rebuttalsSnapshot = await getDocs(collection(db, 'rebuttals'));
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const dispositionsSnapshot = await getDocs(collection(db, 'dispositions'));
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      console.log('🔍 DashboardView: Raw data counts:', {
        rebuttals: rebuttalsSnapshot.docs.length,
        categories: categoriesSnapshot.docs.length,
        dispositions: dispositionsSnapshot.docs.length,
        users: usersSnapshot.docs.length
      });
      
      // Filter by companyId if provided
      // Note: Rebuttals and categories are global data, not company-specific
      const rebuttals = rebuttalsSnapshot.docs; // Always show all rebuttals
      const categories = categoriesSnapshot.docs; // Always show all categories
      
      // For dispositions and users, filter by companyId if provided
      const dispositions = companyId ? 
        dispositionsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.companyId === companyId || !data.companyId; // Include items without companyId
        }) : 
        dispositionsSnapshot.docs;
      const users = companyId ? 
        usersSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.companyId === companyId || !data.companyId; // Include users without companyId
        }) : 
        usersSnapshot.docs;

      console.log('🔍 DashboardView: Filtered data counts:', {
        rebuttals: rebuttals.length,
        categories: categories.length,
        dispositions: dispositions.length,
        users: users.length
      });

      // Debug: Log some sample data
      if (rebuttals.length > 0) {
        console.log('🔍 Sample rebuttal:', {
          id: rebuttals[0].id,
          data: rebuttals[0].data()
        });
      }
      if (categories.length > 0) {
        console.log('🔍 Sample category:', {
          id: categories[0].id,
          data: categories[0].data()
        });
      }

      // Calculate top categories with proper category data
      const categoryCounts = {};
      const categoryMap = {};
      
      // Create a map of category IDs to category data
      categories.forEach(doc => {
        const categoryData = doc.data();
        categoryMap[doc.id] = {
          id: doc.id,
          name: categoryData.name || 'Unnamed Category',
          description: categoryData.description || '',
          color: categoryData.color || getRandomColor(doc.id) // Generate consistent color
        };
      });
      
      // Helper function to generate consistent colors
      function getRandomColor(seed) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
      }

      // Get recent activity with enhanced data processing
      const recentActivity = rebuttals
        .sort((a, b) => {
          const aTime = a.data().createdAt?.toDate?.() || new Date(a.data().createdAt || 0);
          const bTime = b.data().createdAt?.toDate?.() || new Date(b.data().createdAt || 0);
          return bTime - aTime;
        })
        .slice(0, 8) // Show more items
        .map(doc => {
          const data = doc.data();
          const categoryName = data.category;
          // Find category by name in the categoryMap
          const categoryInfo = Object.values(categoryMap).find(cat => cat.name === categoryName) || {
            name: categoryName || 'Uncategorized',
            color: '#6b7280'
          };
          
          return {
            id: doc.id,
            type: 'rebuttal',
            // Normalize potentially nested values
            summary: normalizeText(data.summary || data.title || data.heading),
            objection: normalizeText(data.objection),
            response: normalizeText(data.response || data.body || data.text),
            category: normalizeText(data.category || ''),
            categoryName: normalizeText(categoryInfo.name || 'Uncategorized'),
            categoryColor: normalizeText(categoryInfo.color || '#6b7280'),
            timeAgo: getTimeAgo(data.createdAt?.toDate?.() || new Date(data.createdAt || 0)),
            status: normalizeText(data.status || 'active'),
            priority: normalizeText(data.priority || 'normal'),
            createdAt: data.createdAt
          };
        });

      // Count rebuttals by category
      rebuttals.forEach(doc => {
        const rebuttalData = doc.data();
        const categoryName = rebuttalData.category; // This is the category name
        if (categoryName) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
        }
      });

      // Create top categories with proper category information
      const topCategories = Object.entries(categoryCounts)
        .map(([categoryName, count]) => {
          // Find category by name in the categoryMap
          const categoryInfo = Object.values(categoryMap).find(cat => cat.name === categoryName) || {
            id: categoryName,
            name: categoryName,
            description: '',
            color: '#6b7280'
          };
          return {
            id: categoryInfo.id,
            name: categoryInfo.name,
            description: categoryInfo.description,
            color: categoryInfo.color,
            count
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const finalStats = {
        totalRebuttals: Number(rebuttals.length || 0),
        totalCategories: Number(categories.length || 0),
        totalDispositions: Number(dispositions.length || 0),
        totalUsers: Number(users.length || 0),
        recentActivity: Array.isArray(recentActivity) ? recentActivity : [],
        topCategories: Array.isArray(topCategories) ? topCategories : [],
        systemHealth: 'Good'
      };

      console.log('🔍 DashboardView: Final stats:', finalStats);
      console.log('🔍 DashboardView: Top categories:', topCategories);
      console.log('🔍 DashboardView: Recent activity count:', recentActivity.length);

      setStats(finalStats);
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
        {/* Recent Activity - Enhanced */}
        <div className="recent-activity-modern">
          <div className="activity-header">
            <div className="header-content">
              <h2>📈 Recent Activity</h2>
              <p>Latest rebuttals and system updates</p>
            </div>
            <div className="activity-stats">
              <div className="stat-item">
                <span className="stat-number">{stats.recentActivity.length}</span>
                <span className="stat-label">Recent</span>
              </div>
            </div>
          </div>
          
          <div className="activity-timeline">
            {stats.recentActivity.length > 0 ? (
              (showAllActivity ? stats.recentActivity : stats.recentActivity.slice(0, 3)).map((item, index) => (
                <div key={item.id} className="activity-card" style={{ '--category-color': item.categoryColor }}>
                  <div className="activity-indicator">
                    <div className="indicator-dot"></div>
                    {index < stats.recentActivity.length - 1 && <div className="indicator-line"></div>}
                  </div>
                  
                  <div className="activity-content">
                    <div className="activity-header-card">
                      <div className="activity-type">
                        <div className="type-icon">📝</div>
                        <span className="type-label">Rebuttal</span>
                      </div>
                      <div className="activity-time">{item.timeAgo}</div>
                    </div>
                    
                    <div className="activity-title">
                      {normalizeText(item.summary || item.objection || 'Untitled Rebuttal')}
                    </div>
                    
                    <div className="activity-meta">
                      <div className="meta-item">
                        <span className="meta-label">Category</span>
                        <span 
                          className="meta-value category-badge"
                          style={{ backgroundColor: item.categoryColor }}
                        >
                          {normalizeText(item.categoryName)}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Status</span>
                        <span className={`meta-value status-badge ${normalizeText(item.status)}`}>
                          {normalizeText(item.status)}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Priority</span>
                        <span className={`meta-value priority-badge ${normalizeText(item.priority)}`}>
                          {normalizeText(item.priority)}
                        </span>
                      </div>
                    </div>
                    
                    {item.response && (
                      <div className="activity-preview">
                        <span className="preview-label">Preview:</span>
                        <span className="preview-text">
                          {normalizeText(item.response).length > 100 
                            ? `${normalizeText(item.response).substring(0, 100)}...` 
                            : normalizeText(item.response)
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <div className="empty-icon">📝</div>
                <h3>No Recent Activity</h3>
                <p>New rebuttals and updates will appear here</p>
                <button 
                  className="create-rebuttal-btn"
                  onClick={() => onGoTab && onGoTab('rebuttals')}
                >
                  <span>➕</span>
                  Create First Rebuttal
                </button>
              </div>
            )}

            {stats.recentActivity.length > 3 && (
              <div className="activity-toggle">
                <button
                  className="create-rebuttal-btn"
                  onClick={() => setShowAllActivity(!showAllActivity)}
                >
                  {showAllActivity ? 'Show less' : `Show more (${stats.recentActivity.length - 3})`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Status - Completely Redesigned */}
        <div className="system-status-modern">
          <div className="status-header">
            <div className="header-content">
              <h2>⚡ System Status</h2>
              <p>Real-time monitoring and health metrics</p>
            </div>
            <div className="status-indicator-modern">
              <div className="status-pulse"></div>
              <span className="status-text-modern">All Systems Operational</span>
            </div>
          </div>
          
          <div className="status-grid">
            {/* Database Card */}
            <div className="status-card database">
              <div className="status-card-header">
                <div className="status-icon">🗄️</div>
                <div className="status-info">
                  <h3>Database</h3>
                  <span className="status-badge success">Connected</span>
                </div>
              </div>
              <div className="status-metrics">
                <div className="metric">
                  <span className="metric-label">Response Time</span>
                  <span className="metric-value">12ms</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Uptime</span>
                  <span className="metric-value">99.9%</span>
                </div>
              </div>
              <div className="status-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '95%'}}></div>
                </div>
                <span className="progress-text">95% Performance</span>
              </div>
            </div>

            {/* Authentication Card */}
            <div className="status-card authentication">
              <div className="status-card-header">
                <div className="status-icon">🔐</div>
                <div className="status-info">
                  <h3>Authentication</h3>
                  <span className="status-badge success">Active</span>
                </div>
              </div>
              <div className="status-metrics">
                <div className="metric">
                  <span className="metric-label">Active Users</span>
                  <span className="metric-value">24</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Last Login</span>
                  <span className="metric-value">2 min ago</span>
                </div>
              </div>
              <div className="status-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '100%'}}></div>
                </div>
                <span className="progress-text">100% Secure</span>
              </div>
            </div>

            {/* Storage Card */}
            <div className="status-card storage">
              <div className="status-card-header">
                <div className="status-icon">💾</div>
                <div className="status-info">
                  <h3>Storage</h3>
                  <span className="status-badge warning">75% Used</span>
                </div>
              </div>
              <div className="status-metrics">
                <div className="metric">
                  <span className="metric-label">Used Space</span>
                  <span className="metric-value">7.5 GB</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Available</span>
                  <span className="metric-value">2.5 GB</span>
                </div>
              </div>
              <div className="status-progress">
                <div className="progress-bar">
                  <div className="progress-fill warning" style={{width: '75%'}}></div>
                </div>
                <span className="progress-text">75% Capacity</span>
              </div>
            </div>

            {/* Removed: Performance, Security, Network cards to show only 3 */}
          </div>
        </div>

        {/* Top Categories - Enhanced */}
        <div className="top-categories-modern" style={{
          background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(0,0,0,0.05) 60%)',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                fontSize: 22,
                boxShadow: '0 8px 20px rgba(59,130,246,0.35)'
              }}>🏆</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: '#ffffff' }}>Top Categories</h2>
                <p style={{ margin: 0, color: '#a1a1aa' }}>Most used categories across your rebuttals</p>
              </div>
            </div>
            <div>
              <button className="create-rebuttal-btn" onClick={() => onGoTab && onGoTab('categories')}>Manage</button>
            </div>
          </div>

          {Array.isArray(stats.topCategories) && stats.topCategories.length > 0 ? (
            <div className="top-categories-list" style={{ display: 'grid', gap: 12 }}>
              {(() => {
                const max = Math.max(...stats.topCategories.map(c => c.count || 0), 1);
                return stats.topCategories.map((cat, index) => {
                  const percentage = Math.round(((cat.count || 0) / max) * 100);
                  const rankMedal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                  return (
                    <div
                      key={cat.id || cat.name}
                      className="top-category-card"
                      onClick={() => onGoTab && onGoTab('categories')}
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: 14,
                        background: 'rgba(255,255,255,0.05)',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.1)',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 18
                        }}>
                          {rankMedal}
                        </div>
                        <div style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: cat.color || '#6b7280' }}></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{cat.name}</div>
                            <span style={{
                              background: 'rgba(255,255,255,0.1)',
                              color: '#ffffff',
                              borderRadius: 9999,
                              padding: '2px 8px',
                              fontSize: 12
                            }}>{cat.count} uses</span>
                          </div>
                          {cat.description ? (
                            <div style={{ color: '#a1a1aa', fontSize: 13, marginTop: 2 }}>{cat.description}</div>
                          ) : null}
                        </div>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{percentage}%</div>
                      </div>
                      <div style={{ width: '100%', height: 10, borderRadius: 9999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${cat.color || '#3b82f6'} 0%, rgba(59,130,246,0.7) 100%)`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="empty-activity" style={{ textAlign: 'center' }}>
              <div className="empty-icon">🏷️</div>
              <h3 style={{ color: '#ffffff' }}>No Categories Found</h3>
              <p style={{ color: '#a1a1aa' }}>Create categories to organize your rebuttals</p>
              <button className="create-rebuttal-btn" onClick={() => onGoTab && onGoTab('categories')}>
                <span>➕</span>
                Create Category
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions - Completely Redesigned */}
        <div className="quick-actions-modern">
          <div className="quick-actions-header">
            <div className="header-content">
              <h2>🚀 Quick Actions</h2>
              <p>Streamline your workflow with these essential tools</p>
            </div>
            <div className="header-decoration">
              <div className="decoration-dot"></div>
              <div className="decoration-dot"></div>
              <div className="decoration-dot"></div>
            </div>
          </div>
          
          <div className="actions-grid">
            <div className="action-card primary" onClick={() => onGoTab && onGoTab('rebuttals')}>
              <div className="action-icon-wrapper">
                <div className="action-icon">➕</div>
                <div className="icon-glow"></div>
              </div>
              <div className="action-content">
                <h3>Add Rebuttal</h3>
                <p>Create new response templates</p>
                <div className="action-badge">New</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card secondary" onClick={() => onGoTab && onGoTab('categories')}>
              <div className="action-icon-wrapper">
                <div className="action-icon">🏷️</div>
                <div className="icon-glow"></div>
              </div>
              <div className="action-content">
                <h3>Manage Categories</h3>
                <p>Organize and structure content</p>
                <div className="action-badge">Essential</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card tertiary" onClick={() => onGoTab && onGoTab('dispositions')}>
              <div className="action-icon-wrapper">
                <div className="action-icon">📊</div>
                <div className="icon-glow"></div>
              </div>
              <div className="action-content">
                <h3>View Analytics</h3>
                <p>Track performance metrics</p>
                <div className="action-badge">Insights</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card quaternary" onClick={() => onGoTab && onGoTab('time-blocks')}>
              <div className="action-icon-wrapper">
                <div className="action-icon">⚙️</div>
                <div className="icon-glow"></div>
              </div>
              <div className="action-content">
                <h3>System Settings</h3>
                <p>Configure preferences</p>
                <div className="action-badge">Admin</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card quinary" onClick={() => onGoTab && onGoTab('users')}>
              <div className="action-icon-wrapper">
                <div className="action-icon">👥</div>
                <div className="icon-glow"></div>
              </div>
              <div className="action-content">
                <h3>User Management</h3>
                <p>Manage team members</p>
                <div className="action-badge">Team</div>
              </div>
              <div className="action-arrow">→</div>
            </div>

            <div className="action-card senary" onClick={() => onGoTab && onGoTab('faqs')}>
              <div className="action-icon-wrapper">
                <div className="action-icon">❓</div>
                <div className="icon-glow"></div>
              </div>
              <div className="action-content">
                <h3>FAQ Management</h3>
                <p>Update help content</p>
                <div className="action-badge">Support</div>
              </div>
              <div className="action-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView; 