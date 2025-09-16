import React, { useState, useEffect } from 'react';
import { timeAgo, getIndustryCounts, getPlanCounts } from '../../../utils/saasAdminUtils';

const SaasDashboardOverview = ({ companies, platforms, users, adminUser }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState('companies');
  
  const industryCounts = getIndustryCounts(companies);
  const planCounts = getPlanCounts(companies);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate advanced metrics
  const totalRevenue = companies.reduce((sum, company) => {
    const planPrices = { starter: 29, professional: 99, enterprise: 299 };
    return sum + (planPrices[company.plan] || 99);
  }, 0);

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const inactiveCompanies = companies.filter(c => c.status === 'inactive').length;
  const avgUsersPerCompany = companies.length > 0 ? Math.round(users.length / companies.length) : 0;
  
  // Growth calculations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCompanies = companies.filter(c => {
    const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    return createdAt > thirtyDaysAgo;
  }).length;

  const recentUsers = users.filter(u => {
    const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    return createdAt > thirtyDaysAgo;
  }).length;

  // Get recent activity
  const recentCompaniesList = companies
    .filter(c => c.createdAt)
    .sort((a, b) => {
      const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 5);

  const recentUsersList = users
    .filter(u => u.createdAt)
    .sort((a, b) => {
      const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 3);

  const activities = [
    ...recentCompaniesList.map(company => ({
      type: 'company',
      title: `New company registered: ${company.name}`,
      time: company.createdAt,
      icon: '🏢',
      status: company.status
    })),
    ...recentUsersList.map(user => ({
      type: 'user',
      title: `New user signup: ${user.email || user.name || 'Unknown'}`,
      time: user.createdAt,
      icon: '👥',
      status: user.isActive ? 'active' : 'inactive'
    }))
  ].sort((a, b) => {
    const dateA = a.time.toDate ? a.time.toDate() : new Date(a.time);
    const dateB = b.time.toDate ? b.time.toDate() : new Date(b.time);
    return dateB - dateA;
  }).slice(0, 8);

  // Top performing companies
  const topCompanies = companies
    .map(company => ({
      ...company,
      userCount: users.filter(u => u.companyId === company.id).length
    }))
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 5);

  return (
    <div className="saas-content">
      {/* Clean Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">SaaS Platform Overview</p>
          </div>
          <div className="header-right">
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="main-dashboard">
        {/* Clean Overview Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <h3>Companies</h3>
              <div className="metric-icon">🏢</div>
            </div>
            <div className="metric-value">{companies.length}</div>
            <div className="metric-detail">{activeCompanies} active</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <h3>Platforms</h3>
              <div className="metric-icon">🎯</div>
            </div>
            <div className="metric-value">{platforms.length}</div>
            <div className="metric-detail">All deployed</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <h3>Users</h3>
              <div className="metric-icon">👥</div>
            </div>
            <div className="metric-value">{users.length}</div>
            <div className="metric-detail">Avg {avgUsersPerCompany}/company</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <h3>Revenue</h3>
              <div className="metric-icon">💰</div>
            </div>
            <div className="metric-value">${totalRevenue.toLocaleString()}</div>
            <div className="metric-detail">Monthly MRR</div>
          </div>
        </div>

        {/* Clean Content Sections */}
        <div className="content-sections">
          {/* Recent Activity */}
          <div className="content-section">
            <div className="section-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="activity-list">
              {activities.length === 0 ? (
                <div className="empty-state">
                  <p>No recent activity</p>
                </div>
              ) : (
                activities.slice(0, 4).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-time">{timeAgo(activity.time)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Companies */}
          <div className="content-section">
            <div className="section-header">
              <h3>Top Companies</h3>
            </div>
            <div className="companies-list">
              {topCompanies.length === 0 ? (
                <div className="empty-state">
                  <p>No companies yet</p>
                </div>
              ) : (
                topCompanies.slice(0, 3).map((company, index) => (
                  <div key={company.id} className="company-item">
                    <div className="company-rank">#{index + 1}</div>
                    <div className="company-info">
                      <div className="company-name">{company.name}</div>
                      <div className="company-users">{company.userCount} users</div>
                    </div>
                    <div className={`company-status ${company.status}`}>
                      {company.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaasDashboardOverview;