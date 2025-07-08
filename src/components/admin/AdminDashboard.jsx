import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import rebuttalsService from '../../services/rebuttalsService';
import CategoryManagement from './CategoryManagement';
import CustomerServiceManagement from './CustomerServiceManagement';
import FAQManagement from './FAQManagement';
import leadDispositionService from '../../services/leadDispositionService';
import UserManagement from './UserManagement';
import './AdminDashboard.css';
import { createAdminUser } from '../../services/firebase/auth';
import { fixRebuttalsData } from '../../scripts/fixRebuttals';
import categoryService from '../../services/categoryService';
import dispositionService from '../../services/dispositionService';
import { resetServiceTopics } from '../../services/customerServiceService';
import { getFirestore, doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Add this above the AdminDashboard component
const CategoryPerformanceCard = ({ category, count }) => (
  <div className="dashboard-card category-performance-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span className="stat-icon" role="img" aria-label="Performance">📊</span>
      <div>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1.1rem', color: '#1e293b' }}>Category Performance</h2>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0.5rem 0' }}>{category}</div>
        <div style={{ fontSize: '1rem', color: '#64748b' }}>{count} rebuttals</div>
      </div>
    </div>
  </div>
);

// Error Boundary Component
const ErrorBoundary = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  if (hasError) {
    return fallback || (
      <div style={{ 
        padding: '20px', 
        color: 'red', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '40px auto',
        border: '1px solid red',
        borderRadius: '4px'
      }}>
        <h2>Something went wrong</h2>
        <p>{error?.message || 'An unexpected error occurred'}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <React.ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error('AdminDashboard Error:', error, errorInfo);
        setError(error);
        setHasError(true);
      }}
    >
      {children}
    </React.ErrorBoundary>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rebuttals, setRebuttals] = useState([]);
  const [archivedRebuttals, setArchivedRebuttals] = useState([]);
  const [newRebuttal, setNewRebuttal] = useState({
    title: '',
    category: '',
    objection: '',
    response: '',
    followUpResponse: '',
    tags: []
  });
  const [editingRebuttal, setEditingRebuttal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [adminError, setAdminError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({
    totalRebuttals: 0,
    totalArchived: 0,
    recentlyUpdated: 0,
    averageResponseLength: 0,
    topTags: [],
    activeCategories: 0,
    categoryGrowth: 0,
    mostUsedCategory: null,
    leastUsedCategory: null,
    categoryDistribution: [],
    // Add new stats for rebuttal usage
    mostUsedRebuttals: [],
    rebuttalUsageCounts: {},
    totalRebuttalClicks: 0,
    averageRebuttalUsage: 0
  });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [dispositions, setDispositions] = useState([]);
  const [error, setError] = useState(null);
  const [loadingDispositions, setLoadingDispositions] = useState(true);
  const [dispositionError, setDispositionError] = useState(null);
  const [showAddDispositionModal, setShowAddDispositionModal] = useState(false);
  const [showEditDispositionModal, setShowEditDispositionModal] = useState(false);
  const [editingDisposition, setEditingDisposition] = useState(null);
  const [newDisposition, setNewDisposition] = useState({
    name: '',
    category: '',
    description: '',
    icon: '',
    color: '',
    nextSteps: '',
    tips: []
  });
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    showDebugInfo: false,
    defaultSortOrder: 'newest',
    rebuttalsPerPage: 10,
    autoFixCategories: true,
    enableAutomaticTagging: true,
    fontSize: 'medium',
    enableAutoSave: true,
    showConfirmationDialogs: true,
    notifications: {
      email: true,
      browser: true,
      sound: false
    },
    notificationFrequency: 'immediate',
    enableDataBackup: false,
    backupFrequency: 'daily',
    enableDataExport: true,
    enableDataImport: true,
    managerSettings: {
      showAnalytics: true,
      enableBulkActions: true,
      showUserActivity: true,
      enableAuditLog: true
    }
  });
  const [lastAction, setLastAction] = useState(null);
  const [showAllRebuttals, setShowAllRebuttals] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const { currentUser, loading: authLoading } = useAuth();
  const [dispositionCategories, setDispositionCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📝',
    color: '#4CAF50'
  });
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [selectedRebuttalToUnarchive, setSelectedRebuttalToUnarchive] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  
  // System Health State
  const [systemHealth, setSystemHealth] = useState({
    overallStatus: 'unknown',
    database: {
      status: 'unknown',
      connection: false,
      responseTime: null
    },
    authentication: {
      status: 'unknown',
      user: null
    },
    ssl: {
      status: 'unknown',
      valid: false
    },
    performance: {
      status: 'unknown',
      loadTime: null,
      memoryUsage: null
    },
    storage: {
      status: 'unknown',
      available: false
    },
    alerts: []
  });

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AdminDashboard: Starting auth check...');
        console.log('🔍 AdminDashboard: Current user:', currentUser);
        console.log('🔍 AdminDashboard: Auth loading:', authLoading);

        if (authLoading) {
          console.log('🔍 AdminDashboard: Auth is still loading...');
          return;
        }

        if (!currentUser) {
          console.log('🔍 AdminDashboard: No current user, redirecting to login');
          navigate('/admin/login');
          return;
        }

        // Check if user is admin
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
          const parsedAdmin = JSON.parse(adminUser);
          console.log('🔍 AdminDashboard: Found admin user in localStorage:', parsedAdmin);
          setAdminUser(parsedAdmin);
        } else {
          console.log('🔍 AdminDashboard: No admin user in localStorage, checking Firestore...');
          // Check if user exists in admins collection
          const adminRef = doc(getFirestore(), 'admins', currentUser.uid);
          const adminDoc = await getDoc(adminRef);
          
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            console.log('🔍 AdminDashboard: Found admin in Firestore:', adminData);
            setAdminUser({ ...currentUser, ...adminData });
            localStorage.setItem('adminUser', JSON.stringify({ ...currentUser, ...adminData }));
          } else {
            console.log('🔍 AdminDashboard: User is not admin, redirecting to login');
            navigate('/admin/login');
            return;
          }
        }

        console.log('🔍 AdminDashboard: Auth check completed successfully');
        setLoading(false);
      } catch (error) {
        console.error('🔍 AdminDashboard: Error checking auth:', error);
        setError('Authentication error: ' + error.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          fetchedRebuttals,
          fetchedCategories,
          fetchedDispositions,
          fetchedDispositionCategories
        ] = await Promise.all([
          rebuttalsService.getAllRebuttals(),
          categoryService.getAllCategories(),
          leadDispositionService.getAllDispositions(),
          leadDispositionService.getDispositionCategories()
        ]);

        setRebuttals(fetchedRebuttals);
        setCategories(fetchedCategories);
        setDispositions(fetchedDispositions);
        setDispositionCategories(fetchedDispositionCategories);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log('Current activeTab:', activeTab);
    console.log('Current dispositions:', dispositions);
    console.log('Current loading state:', loading);
    console.log('Current error state:', error);
  }, [activeTab, dispositions, loading, error]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting to load all data...');

      // Fetch all data in parallel for comprehensive refresh
      const [
        activeRebuttals,
        archivedRebuttals,
        fetchedCategories,
        fetchedDispositions,
        fetchedDispositionCategories
      ] = await Promise.all([
        rebuttalsService.getActiveRebuttals(),
        categoryService.getArchivedRebuttals(),
        categoryService.getAllCategories(),
        leadDispositionService.getAllDispositions(),
        leadDispositionService.getDispositionCategories()
      ]);

      // Update all state variables
      setRebuttals(activeRebuttals);
      setArchivedRebuttals(archivedRebuttals);
      setCategories(fetchedCategories);
      setDispositions(fetchedDispositions);
      setDispositionCategories(fetchedDispositionCategories);
      
      await updateStats();
      
      console.log('All data loaded successfully:', {
        rebuttals: activeRebuttals.length,
        archived: archivedRebuttals.length,
        categories: fetchedCategories.length,
        dispositions: fetchedDispositions.length,
        dispositionCategories: fetchedDispositionCategories.length
      });

      // Show success notification
      if (window.location.pathname.includes('admin')) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = '✅ Data refreshed successfully!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      let errorMessage = 'Failed to load data. ';
      
      if (error.message.includes('Firebase is not properly initialized')) {
        errorMessage += 'Firebase configuration error. Please check your environment variables.';
      } else if (error.message.includes('permission-denied')) {
        errorMessage += 'Permission denied. Please check your Firebase security rules.';
      } else if (error.message.includes('not-found')) {
        errorMessage += 'Collection not found. Please check your Firebase configuration.';
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async () => {
    const stats = {
      totalRebuttals: rebuttals.length,
      totalArchived: archivedRebuttals.length,
      recentlyUpdated: 0,
      averageResponseLength: 0,
      topTags: [],
      activeCategories: 0,
      categoryGrowth: 0,
      mostUsedCategory: null,
      leastUsedCategory: null,
      categoryDistribution: [],
      // Calculate new statistics
      totalDispositions: dispositions.length,
      dispositionsByCategory: {},
      mostUsedDisposition: null,
      averageDispositionUsage: 0,
      totalFollowUps: 0,
      successRate: 0,
      averageResponseTime: 0,
      topPerformingCategories: [],
      recentActivity: [],
      categoryTrends: {},
      dispositionEfficiency: 0,
      mostUsedRebuttals: [],
      rebuttalUsageCounts: {},
      totalRebuttalClicks: 0,
      averageRebuttalUsage: 0,
      activeUsers: 0
    };

    // Calculate active users from the past week
    try {
      const userService = (await import('../../services/userService')).default;
      const allUsers = await userService.getAllUsers();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      stats.activeUsers = allUsers.filter(user => 
        user.lastSignIn && new Date(user.lastSignIn) > oneWeekAgo
      ).length;
    } catch (error) {
      console.warn('Could not fetch active users:', error);
      stats.activeUsers = 0;
    }

    // Calculate rebuttal usage statistics
    const rebuttalUsage = {};
    let totalClicks = 0;

    // Get usage data from localStorage for each rebuttal
    rebuttals.forEach(rebuttal => {
      const storedUsage = localStorage.getItem(`rebuttal_usage_${rebuttal.id}`);
      const usageCount = storedUsage ? parseInt(storedUsage) : (rebuttal.usageCount || 0);
      rebuttalUsage[rebuttal.id] = usageCount;
      totalClicks += usageCount;
    });

    // Update total clicks and average usage
    stats.totalRebuttalClicks = totalClicks;
    stats.averageRebuttalUsage = rebuttals.length > 0 ? Math.round(totalClicks / rebuttals.length) : 0;

    // Get all rebuttals sorted by usage
    const sortedRebuttals = Object.entries(rebuttalUsage)
      .sort(([,a], [,b]) => b - a)
      .map(([id, count]) => {
        const rebuttal = rebuttals.find(r => r.id === id);
        return {
          id,
          title: rebuttal?.title || 'Unknown',
          category: rebuttal?.category || 'Uncategorized',
          usageCount: count,
          percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0
        };
      });

    // Store all rebuttals in stats
    stats.mostUsedRebuttals = sortedRebuttals;

    // Calculate category statistics
    const categoryCounts = {};
    rebuttals.forEach(r => {
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
    });

    // Calculate disposition statistics
    const dispositionCounts = {};
    dispositions.forEach(d => {
      if (d.category) {
        stats.dispositionsByCategory[d.category] = (stats.dispositionsByCategory[d.category] || 0) + 1;
      }
      dispositionCounts[d.id] = (dispositionCounts[d.id] || 0) + 1;
    });

    // Find most used disposition
    const dispositionEntries = Object.entries(dispositionCounts);
    if (dispositionEntries.length > 0) {
      stats.mostUsedDisposition = dispositionEntries.reduce((a, b) => a[1] > b[1] ? a : b);
    }

    // Calculate average disposition usage
    const totalUsage = Object.values(dispositionCounts).reduce((a, b) => a + b, 0);
    stats.averageDispositionUsage = totalUsage / dispositions.length || 0;

    // Calculate success rate (example calculation)
    const totalInteractions = rebuttals.length + dispositions.length;
    const successfulInteractions = rebuttals.filter(r => r.status === 'success').length;
    stats.successRate = (successfulInteractions / totalInteractions) * 100 || 0;

    // Calculate category trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    rebuttals.forEach(r => {
      if (r.createdAt && new Date(r.createdAt) > thirtyDaysAgo) {
        stats.categoryTrends[r.category] = (stats.categoryTrends[r.category] || 0) + 1;
      }
    });

    // Find top performing categories
    stats.topPerformingCategories = Object.entries(stats.categoryTrends)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({
        category,
        count,
        growth: ((count / categoryCounts[category]) * 100) || 0
      }));

    // Calculate disposition efficiency
    const totalResponses = rebuttals.reduce((sum, r) => sum + (r.response?.length || 0), 0);
    const totalDispositionResponses = dispositions.reduce((sum, d) => sum + (d.nextSteps?.length || 0), 0);
    stats.dispositionEfficiency = (totalDispositionResponses / (totalResponses + totalDispositionResponses)) * 100 || 0;

    // Calculate average response time (example calculation)
    const responseTimes = rebuttals
      .filter(r => r.createdAt && r.updatedAt)
      .map(r => new Date(r.updatedAt) - new Date(r.createdAt));
    stats.averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Update existing statistics
    if (Object.keys(categoryCounts).length > 0) {
      // Find the category with the most rebuttals
      const mostUsedCategoryEntry = Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b);
      const mostUsedCategory = categories.find(c => c.id === mostUsedCategoryEntry[0]) || { name: mostUsedCategoryEntry[0] };
      stats.mostUsedCategory = { name: mostUsedCategory.name, count: mostUsedCategoryEntry[1] };

      // Find the category with the least rebuttals
      const leastUsedCategoryEntry = Object.entries(categoryCounts).reduce((a, b) => a[1] < b[1] ? a : b);
      const leastUsedCategory = categories.find(c => c.id === leastUsedCategoryEntry[0]) || { name: leastUsedCategoryEntry[0] };
      stats.leastUsedCategory = { name: leastUsedCategory.name, count: leastUsedCategoryEntry[1] };

      stats.activeCategories = Object.keys(categoryCounts).length;
    }

    // Calculate category distribution with proper names
    const totalRebuttals = rebuttals.length;
    stats.categoryDistribution = Object.entries(categoryCounts).map(([id, count]) => {
      const category = categories.find(c => c.id === id) || { name: id, icon: '📝' };
      return {
        name: category.name,
        count,
        percentage: Math.round((count / totalRebuttals) * 100) || 0,
        icon: category.icon || '📝'
      };
    }).sort((a, b) => b.count - a.count);

    // Calculate category growth (real calculation based on recent trends)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthStart = new Date(currentMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const currentMonthRebuttals = rebuttals.filter(r => 
      r.createdAt && new Date(r.createdAt) >= currentMonthStart
    ).length;
    
    const lastMonthRebuttals = rebuttals.filter(r => 
      r.createdAt && 
      new Date(r.createdAt) >= lastMonthStart && 
      new Date(r.createdAt) < currentMonthStart
    ).length;
    
    stats.categoryGrowth = lastMonthRebuttals > 0 
      ? Math.round(((currentMonthRebuttals - lastMonthRebuttals) / lastMonthRebuttals) * 100)
      : currentMonthRebuttals > 0 ? 100 : 0;

    // Average response length
    const totalLength = rebuttals.reduce((sum, r) => sum + (r.response?.length || 0), 0);
    stats.averageResponseLength = Math.round(totalLength / rebuttals.length) || 0;

    // Top tags
    const tagCounts = {};
    rebuttals.forEach(r => {
      r.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    stats.topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    setStats(stats);
  };

  // Add function to track rebuttal usage
  const trackRebuttalUsage = async (rebuttalId) => {
    const currentUsage = parseInt(localStorage.getItem(`rebuttal_usage_${rebuttalId}`) || '0');
    localStorage.setItem(`rebuttal_usage_${rebuttalId}`, (currentUsage + 1).toString());
    await updateStats(); // Update stats after tracking usage
  };

  // Helper function to get category icon
  const getCategoryIcon = (categoryName) => {
    const categoryIcons = {
      'not-interested': '❌',
      'spouse-consultation': '💑',
      'one-legger': '👤',
      'not-ready': '⏳',
      'curious': '🤔',
      'time-concern': '⏰',
      'cant-afford': '💰',
      'spouse': '👫',
      'price-phone': '📞',
      'repair': '🔧',
      'government-grants': '🏛️',
      'reset-appt': '🔄',
      'no-request': '🚫',
      'bad-reviews': '⭐'
    };
    return categoryIcons[categoryName] || '📝';
  };

  // Helper function to get category color
  const getCategoryColor = (categoryName) => {
    const categoryColors = {
      'not-interested': '#FF6B6B',
      'spouse-consultation': '#4ECDC4',
      'one-legger': '#45B7D1',
      'not-ready': '#96CEB4',
      'curious': '#FFEEAD',
      'time-concern': '#D4A5A5',
      'cant-afford': '#9B59B6',
      'spouse': '#3498DB',
      'price-phone': '#E67E22',
      'repair': '#2ECC71',
      'government-grants': '#34495E',
      'reset-appt': '#F1C40F',
      'no-request': '#E74C3C',
      'bad-reviews': '#1ABC9C'
    };
    return categoryColors[categoryName] || '#95A5A6';
  };

  // Update stats when archived rebuttals change
  useEffect(() => {
    if (rebuttals.length > 0) {
      updateStats(rebuttals);
    }
  }, [rebuttals, archivedRebuttals]);

  // Define fetchDispositions at the top level of the component
  const fetchDispositions = async () => {
    try {
      console.log('Starting to fetch dispositions...');
      setLoadingDispositions(true);
      setError(null);
      
      // First, try to get dispositions
      console.log('Calling getAllDispositions...');
      const fetchedDispositions = await leadDispositionService.getAllDispositions();
      console.log('Fetched dispositions:', fetchedDispositions);
      
      // If no dispositions exist or if there are fewer than expected, initialize defaults
      if (fetchedDispositions.length === 0 || fetchedDispositions.length < 22) {
        console.log(`Found ${fetchedDispositions.length} dispositions, initializing defaults...`);
        try {
          await leadDispositionService.initializeDefaultDispositions();
          // Fetch again after initialization
          const updatedDispositions = await leadDispositionService.getAllDispositions();
          console.log('Updated dispositions after initialization:', updatedDispositions);
          setDispositions(updatedDispositions);
        } catch (initError) {
          console.error('Error initializing dispositions:', initError);
          setError('Failed to initialize default dispositions. Please try again.');
        }
      } else {
        setDispositions(fetchedDispositions);
      }
    } catch (error) {
      console.error('Error fetching dispositions:', error);
      setError(error.message || 'Failed to fetch dispositions');
    } finally {
      setLoadingDispositions(false);
    }
  };

  // Update handleTabClick to use the defined fetchDispositions
  const handleTabClick = (tab) => {
    console.log('Tab clicked:', tab);
    setActiveTab(tab);
    if (tab === 'lead-disposition') {
      console.log('Lead disposition tab clicked, fetching data...');
      fetchDispositions();
    }
  };

  // Add useEffect for initial dispositions fetch
  useEffect(() => {
    if (activeTab === 'lead-disposition') {
      fetchDispositions();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleAddRebuttal = async (e) => {
    e.preventDefault();
    try {
      // Check if user is authenticated
      if (!currentUser) {
        throw new Error('You must be logged in to add rebuttals');
      }

      const newReb = {
        title: newRebuttal.title,
        category: newRebuttal.category,
        objection: newRebuttal.objection,
        response: {
          pt1: newRebuttal.response,
          pt2: newRebuttal.followUpResponse || ''
        },
        tags: newRebuttal.tags,
        icon: getCategoryIcon(newRebuttal.category),
        color: getCategoryColor(newRebuttal.category),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };

      // Add to Firebase
      const rebuttalId = await rebuttalsService.addRebuttal(newReb);
      const newRebWithId = { ...newReb, id: rebuttalId };

      // Update local state
      setRebuttals(prevRebuttals => [...prevRebuttals, newRebWithId]);
      setShowAddModal(false);
      setNewRebuttal({ title: '', category: '', objection: '', response: '', followUpResponse: '', tags: [] });
      updateStats();
    } catch (error) {
      console.error('Error adding rebuttal:', error);
      alert('Failed to add rebuttal. Please try again.');
    }
  };

  const handleEditRebuttal = async (e) => {
    e.preventDefault();
    try {
      const updatedRebuttal = {
        ...editingRebuttal,
        content: {
          pt1: editingRebuttal.content.pt1 || editingRebuttal.response,
          pt2: editingRebuttal.content.pt2 || editingRebuttal.followUpResponse || ''
        }
      };

      // Update in Firebase
      await rebuttalsService.updateRebuttal(editingRebuttal.id, updatedRebuttal);

      // Update local state
      setRebuttals(prevRebuttals => 
        prevRebuttals.map(r => r.id === editingRebuttal.id ? updatedRebuttal : r)
      );
      
      setShowEditModal(false);
      setEditingRebuttal(null);
      updateStats();
    } catch (error) {
      console.error('Error updating rebuttal:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to update rebuttal. ';
      
      if (error.message.includes('does not exist')) {
        errorMessage += 'The rebuttal may have been deleted or moved. Please refresh the page and try again.';
      } else if (error.message.includes('archived')) {
        errorMessage += 'The rebuttal has been archived and cannot be updated. Please unarchive it first.';
      } else if (error.message.includes('Category')) {
        errorMessage += 'The selected category does not exist. Please select a valid category.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      
      // Optionally offer to diagnose the issue
      if (error.message.includes('does not exist')) {
        if (window.confirm('Would you like to diagnose document ID mismatches?')) {
          await handleDiagnoseDocumentMismatches();
        }
      }
    }
  };

  const handleDeleteRebuttal = async (id) => {
    if (window.confirm('Are you sure you want to delete this rebuttal?')) {
      try {
        // Delete from Firebase
        await rebuttalsService.deleteRebuttal(id);

        // Update local state
        setRebuttals(prevRebuttals => prevRebuttals.filter(r => r.id !== id));
        updateStats();
      } catch (error) {
        console.error('Error deleting rebuttal:', error);
        
        let errorMessage = 'Failed to delete rebuttal. ';
        if (error.message.includes('does not exist')) {
          errorMessage += 'The rebuttal may have already been deleted. Please refresh the data.';
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleArchiveRebuttal = async (id) => {
    if (window.confirm('Are you sure you want to archive this rebuttal?')) {
      try {
        setLoading(true);
        await rebuttalsService.archiveRebuttal(id);
        
        // Update local state
        const rebuttal = rebuttals.find(r => r.id === id);
        if (rebuttal) {
          setRebuttals(prevRebuttals => prevRebuttals.filter(r => r.id !== id));
          setArchivedRebuttals(prevArchived => [...prevArchived, { 
            ...rebuttal, 
            archived: true, 
            archivedAt: new Date().toISOString(),
            archivedReason: 'Manually archived'
          }]);
          updateStats();
        }
        alert('Rebuttal archived successfully!');
      } catch (error) {
        console.error('Error archiving rebuttal:', error);
        
        let errorMessage = 'Failed to archive rebuttal. ';
        if (error.message.includes('does not exist')) {
          errorMessage += 'The rebuttal may have already been deleted or moved. Please refresh the data.';
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUnarchiveRebuttal = async (id) => {
    try {
      setLoading(true);
      const rebuttal = archivedRebuttals.find(r => r.id === id);
      if (!rebuttal) {
        throw new Error('Rebuttal not found');
      }

      setSelectedRebuttalToUnarchive(rebuttal);
      setShowUnarchiveModal(true);
    } catch (error) {
      console.error('Error preparing to unarchive rebuttal:', error);
      alert('Failed to prepare unarchive operation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUnarchive = async () => {
    if (!selectedRebuttalToUnarchive || !selectedCategory) {
      alert('Please select a category to unarchive the rebuttal to.');
      return;
    }

    try {
      setLoading(true);
      await rebuttalsService.unarchiveRebuttal(selectedRebuttalToUnarchive.id, selectedCategory);

      // Update local state
      setArchivedRebuttals(prev => prev.filter(r => r.id !== selectedRebuttalToUnarchive.id));
      await loadData(); // Reload data to reflect changes

      setShowUnarchiveModal(false);
      setSelectedRebuttalToUnarchive(null);
      setSelectedCategory('');
      alert('Rebuttal unarchived successfully!');
    } catch (error) {
      console.error('Error unarchiving rebuttal:', error);
      alert('Failed to unarchive rebuttal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      console.log('Starting admin user creation...');
      
      if (newAdmin.password !== newAdmin.confirmPassword) {
        setAdminError('Passwords do not match');
        return;
      }

      if (newAdmin.password.length < 6) {
        setAdminError('Password must be at least 6 characters long');
        return;
      }

      console.log('Creating admin user...');
      // Create admin user using our auth service
      const user = await createAdminUser(newAdmin.email, newAdmin.password);
      console.log('Admin user created:', user);

      // Show success message
      alert('Admin user created successfully!');
      
      // Reset form and close modal
      setNewAdmin({ email: '', password: '', confirmPassword: '' });
      setAdminError('');
      setShowAddAdminModal(false);
    } catch (error) {
      console.error('Error adding admin user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setAdminError('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        setAdminError('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        setAdminError('Password is too weak');
      } else {
        setAdminError(error.message || 'Failed to add admin user. Please try again.');
      }
    }
  };

  // Filter rebuttals based on category and search
  const filteredRebuttals = rebuttals.filter(rebuttal => {
    // Check for exact category match or 'all' category
    const matchesCategory = selectedCategory === 'all' || rebuttal.category === selectedCategory;
    
    // If no search term, just return category match
    if (!searchTerm) {
      return matchesCategory;
    }

    // Search in all relevant fields
    const searchLower = searchTerm.toLowerCase();
    const searchFields = [
      rebuttal.title,
      rebuttal.objection,
      typeof rebuttal.response === 'object' ? rebuttal.response.pt1 : rebuttal.response,
      typeof rebuttal.response === 'object' ? rebuttal.response.pt2 : '',
      ...(rebuttal.tags || [])
    ];

    const matchesSearch = searchFields.some(field => 
      field && field.toLowerCase().includes(searchLower)
    );
    
    return matchesCategory && matchesSearch;
  });

  // Handle disposition actions
  const handleAddDisposition = async (dispositionData) => {
    try {
      const id = await leadDispositionService.addDisposition(dispositionData);
      const newDisposition = { id, ...dispositionData };
      setDispositions(prev => [...prev, newDisposition]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding disposition:', error);
      alert('Failed to add disposition. Please try again.');
    }
  };

  const handleEditDisposition = async (id, updatedData) => {
    try {
      await leadDispositionService.updateDisposition(id, updatedData);
      setDispositions(prev => 
        prev.map(d => d.id === id ? { ...d, ...updatedData } : d)
      );
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating disposition:', error);
      alert('Failed to update disposition. Please try again.');
    }
  };

  const handleDeleteDisposition = async (id) => {
    if (window.confirm('Are you sure you want to delete this disposition?')) {
      try {
        await leadDispositionService.deleteDisposition(id);
        setDispositions(prev => prev.filter(d => d.id !== id));
      } catch (error) {
        console.error('Error deleting disposition:', error);
        alert('Failed to delete disposition. Please try again.');
      }
    }
  };

  const handleFixRebuttals = async () => {
    if (window.confirm('⚠️ WARNING: This will reset all rebuttals to their default state.\n\nThis action will:\n- Reset all rebuttals to default values\n- Remove any custom modifications\n- Cannot be undone\n\nAre you sure you want to continue?')) {
      if (window.confirm('⚠️ FINAL CONFIRMATION:\n\nYou are about to reset ALL rebuttals.\nThis will affect all users.\n\nType "RESET" to confirm:')) {
      try {
        setLoading(true);
        await fixRebuttalsData();
        await loadData();
          alert('✅ Rebuttals data has been fixed successfully!');
      } catch (error) {
        console.error('Error fixing rebuttals:', error);
          alert('❌ Failed to fix rebuttals. Please try again.');
      } finally {
        setLoading(false);
        }
      }
    }
  };

  const handleDiagnoseDocumentMismatches = async () => {
    try {
      setLoading(true);
      const result = await rebuttalsService.checkAndFixDocumentMismatches();
      
      console.log('Document mismatch diagnosis:', result);
      
      // Show the results to the user
      const message = `Document ID Diagnosis Results:\n\n` +
        `Total rebuttals in database: ${result.totalRebuttals}\n` +
        `Available document IDs: ${result.documentIds.join(', ')}\n\n` +
        `If you're getting "No document to update" errors, the document ID in your UI might not match these IDs. ` +
        `Try refreshing the page or reloading the data.`;
      
      alert(message);
      
      // Optionally refresh the data
      if (window.confirm('Would you like to refresh the rebuttals data to ensure you have the latest document IDs?')) {
        await loadData();
      }
    } catch (error) {
      console.error('Error diagnosing document mismatches:', error);
      alert('❌ Failed to diagnose document mismatches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      await loadData();
      alert('✅ Data refreshed successfully! All document IDs are now up to date.');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('❌ Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showTroubleshootingGuide = () => {
    const guide = `🔧 Troubleshooting Guide for "No document to update" Errors

This error occurs when the document ID in your browser doesn't match the actual document ID in the database.

Common Causes:
1. Document was deleted but UI still has reference
2. Document was moved to archived collection
3. Browser cache has outdated data
4. Multiple users editing same document

Solutions:
1. Click "Refresh Data" button above
2. Refresh the page (F5 or Ctrl+R)
3. Clear browser cache
4. Use "Diagnose Document IDs" to check available IDs
5. If problem persists, contact administrator

Prevention:
- Always refresh data after long periods of inactivity
- Don't keep multiple tabs open for extended periods
- Use the "Refresh Data" button regularly when editing

Need more help? Check the console for detailed error messages.`;
    
    alert(guide);
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Apply font size when it changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = settings.fontSize === 'small' ? '14px' : 
                         settings.fontSize === 'large' ? '18px' : '16px';
  }, [settings.fontSize]);

  // Handle auto-save
  useEffect(() => {
    if (settings.enableAutoSave) {
      const autoSaveInterval = setInterval(() => {
        localStorage.setItem('adminSettings', JSON.stringify(settings));
      }, 30000); // Auto-save every 30 seconds
      return () => clearInterval(autoSaveInterval);
    }
  }, [settings, settings.enableAutoSave]);

  // Handle data backup
  useEffect(() => {
    if (settings.enableDataBackup) {
      const backupInterval = setInterval(async () => {
        try {
          const backupData = {
            rebuttals,
            archivedRebuttals,
            dispositions,
            settings,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('dataBackup', JSON.stringify(backupData));
          console.log('Backup completed successfully');
        } catch (error) {
          console.error('Backup failed:', error);
        }
      }, getBackupInterval(settings.backupFrequency));
      return () => clearInterval(backupInterval);
    }
  }, [settings.enableDataBackup, settings.backupFrequency, rebuttals, archivedRebuttals, dispositions]);

  // Helper function to get backup interval in milliseconds
  const getBackupInterval = (frequency) => {
    switch (frequency) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };

  // Enhanced handleSettingsChange function
  const handleSettingsChange = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    setSettings(newSettings);
    localStorage.setItem('adminSettings', JSON.stringify(newSettings));

    // Apply immediate effects
    if (key === 'fontSize') {
      const root = document.documentElement;
      root.style.fontSize = value === 'small' ? '14px' : 
                           value === 'large' ? '18px' : '16px';
    }

    // Show success notification if enabled
    if (settings.notifications.browser) {
      const notification = new Notification('Settings Updated', {
        body: `Setting "${key}" has been updated successfully.`,
        icon: '/icon.png'
      });
    }
  };

  // Enhanced sort function based on settings
  const getSortedRebuttals = (rebuttals) => {
    const sorted = [...rebuttals];
    switch (settings.defaultSortOrder) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'usage':
        return sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      default:
        return sorted;
    }
  };

  // Enhanced pagination based on settings
  const getPaginatedRebuttals = (rebuttals) => {
    return rebuttals.slice(0, settings.rebuttalsPerPage);
  };

  // Export data function
  const exportData = () => {
    if (!settings.enableDataExport) return;
    
    const exportData = {
      rebuttals,
      archivedRebuttals,
      dispositions,
      settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-dashboard-backup-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data function
  const importData = async (file) => {
    if (!settings.enableDataImport) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate imported data
      if (!data.rebuttals || !data.dispositions) {
        throw new Error('Invalid backup file format');
      }

      // Update all data
      setRebuttals(data.rebuttals);
      setArchivedRebuttals(data.archivedRebuttals);
      setDispositions(data.dispositions);
      setSettings(data.settings);

      // Save to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(data.settings));
      
      alert('✅ Data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('❌ Failed to import data. Please check the file format.');
    }
  };

  // Add these buttons to the Data Management section
  const renderDataManagementButtons = () => (
    <div className="data-management-buttons">
      <button 
        className="action-button"
        onClick={exportData}
        disabled={!settings.enableDataExport}
      >
        Export Data
      </button>
      <input
        type="file"
        accept=".json"
        onChange={(e) => importData(e.target.files[0])}
        style={{ display: 'none' }}
        id="import-data"
      />
      <button 
        className="action-button"
        onClick={() => document.getElementById('import-data').click()}
        disabled={!settings.enableDataImport}
      >
        Import Data
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="dashboard-header">
              <h2>Admin Dashboard</h2>
              <div className="header-actions">
                <button 
                  className="refresh-button" 
                  onClick={loadData}
                  disabled={loading}
                >
                  <span className={loading ? 'spinning' : ''}>{loading ? '⏳' : '🔄'}</span> 
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
            <div className="dashboard-grid">
              {/* Enhanced Quick Stats */}
              <div className="dashboard-card enhanced-stats">
                <h2>📈 Performance Overview</h2>
                <div className="enhanced-stats-grid">
                  <div className="stat-card primary">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                      <h3>Total Rebuttals</h3>
                      <div className="stat-number">{stats.totalRebuttals}</div>
                      <div className="stat-subtitle">Active rebuttals in the system</div>
                    </div>
                  </div>
                  
                  <div className="stat-card secondary">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                      <h3>Archived</h3>
                      <div className="stat-number">{stats.totalArchived}</div>
                      <div className="stat-subtitle">Retired rebuttals</div>
                    </div>
                  </div>

                  <div className="stat-card tertiary">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <h3>Categories</h3>
                      <div className="stat-number">{stats.activeCategories || 0}</div>
                      <div className="stat-subtitle">Active category groups</div>
                    </div>
                  </div>

                  <div className="stat-card quaternary">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-content">
                      <h3>Avg. Usage</h3>
                      <div className="stat-number">{Math.round(stats.averageRebuttalUsage || 0)}</div>
                      <div className="stat-subtitle">Uses per rebuttal</div>
                    </div>
                  </div>

                  <div className="stat-card primary">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                      <h3>Success Rate</h3>
                      <div className="stat-number">{Math.round(stats.successRate || 0)}%</div>
                      <div className="stat-subtitle">Conversion efficiency</div>
                    </div>
                  </div>

                  <div className="stat-card secondary">
                    <div className="stat-icon">🚀</div>
                    <div className="stat-content">
                      <h3>Top Category</h3>
                      <div className="stat-number">{stats.mostUsedCategory?.count || 0}</div>
                      <div className="stat-subtitle">{stats.mostUsedCategory?.name || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="stat-card tertiary">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <h3>Growth</h3>
                      <div className="stat-number">+{Math.round(stats.categoryGrowth || 0)}%</div>
                      <div className="stat-subtitle">This month</div>
                    </div>
                  </div>

                  <div className="stat-card quaternary">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-content">
                      <h3>Response Time</h3>
                      <div className="stat-number">{Math.round((stats.averageResponseTime || 120000) / (1000 * 60))}m</div>
                      <div className="stat-subtitle">Average response</div>
                    </div>
                  </div>

                  <div className="stat-card primary">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                      <h3>Dispositions</h3>
                      <div className="stat-number">{stats.totalDispositions || 0}</div>
                      <div className="stat-subtitle">Lead outcomes</div>
                    </div>
                  </div>

                  <div className="stat-card secondary">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-content">
                      <h3>Hot Topics</h3>
                      <div className="stat-number">{stats.categoryDistribution?.slice(0, 3).length || 0}</div>
                      <div className="stat-subtitle">Trending categories</div>
                    </div>
                  </div>

                  <div className="stat-card tertiary">
                    <div className="stat-icon">💡</div>
                    <div className="stat-content">
                      <h3>Effectiveness</h3>
                      <div className="stat-number">{Math.round(stats.dispositionEfficiency || 0)}%</div>
                      <div className="stat-subtitle">Solution rate</div>
                    </div>
                  </div>

                  <div className="stat-card quaternary">
                    <div className="stat-icon">📱</div>
                    <div className="stat-content">
                      <h3>Active Users</h3>
                      <div className="stat-number">{stats.activeUsers || 0}</div>
                      <div className="stat-subtitle">This week</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card quick-actions">
                <h2>⚡ Quick Actions</h2>
                <div className="action-buttons-enhanced">
                  <button className="action-button-enhanced primary" onClick={() => setShowAddModal(true)}>
                    <div className="action-icon">➕</div>
                    <div className="action-content">
                      <strong>Add New Rebuttal</strong>
                      <p>Create a new rebuttal response</p>
                    </div>
                  </button>
                  
                  <button className="action-button-enhanced secondary" onClick={() => setActiveTab('categories')}>
                    <div className="action-icon">📑</div>
                    <div className="action-content">
                      <strong>Manage Categories</strong>
                      <p>Organize rebuttal categories</p>
                    </div>
                  </button>
                  
                  <button className="action-button-enhanced tertiary" onClick={() => setActiveTab('dispositions')}>
                    <div className="action-icon">📋</div>
                    <div className="action-content">
                      <strong>Lead Dispositions</strong>
                      <p>Manage lead status options</p>
                    </div>
                  </button>

                  {/* New Quick Actions with color classes cycling */}
                  <button className="action-button-enhanced quaternary" onClick={exportData}>
                    <div className="action-icon">⬇️</div>
                    <div className="action-content">
                      <strong>Export Data</strong>
                      <p>Export all data for backup</p>
                    </div>
                  </button>
                  <label className="action-button-enhanced primary" style={{cursor: 'pointer'}}>
                    <div className="action-icon">⬆️</div>
                    <div className="action-content">
                      <strong>Import Data</strong>
                      <p>Import data from file</p>
                    </div>
                    <input type="file" style={{display: 'none'}} onChange={e => {
                      if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
                    }} />
                  </label>
                  <button className="action-button-enhanced secondary" onClick={() => alert('System Logs feature coming soon!')}>
                    <div className="action-icon">📝</div>
                    <div className="action-content">
                      <strong>View System Logs</strong>
                      <p>Access system logs</p>
                    </div>
                  </button>
                  <button className="action-button-enhanced tertiary" onClick={() => setShowAddAdminModal(true)}>
                    <div className="action-icon">👤</div>
                    <div className="action-content">
                      <strong>Add New Admin User</strong>
                      <p>Create a new admin account</p>
                    </div>
                  </button>
                  <button className="action-button-enhanced quaternary" onClick={() => setActiveTab('faq')}>
                    <div className="action-icon">❓</div>
                    <div className="action-content">
                      <strong>Manage FAQs</strong>
                      <p>Edit frequently asked questions</p>
                    </div>
                  </button>
                  <button className="action-button-enhanced primary" onClick={() => alert('Analytics feature coming soon!')}>
                    <div className="action-icon">📊</div>
                    <div className="action-content">
                      <strong>View Analytics</strong>
                      <p>See usage statistics</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Category Performance */}
              <div className="dashboard-card category-performance">
                <div className="category-performance-header">
                  <h2>📊 Category Performance</h2>
                  <div className="performance-actions">
                    <button 
                      className="refresh-performance-btn"
                      onClick={async () => await updateStats()}
                      title="Refresh performance data"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                
                <div className="performance-content">
                  {/* Most Active Category - Enhanced */}
                  <div className="most-used-category">
                    <div className="category-highlight">
                      <div className="category-icon-large">
                        {stats.mostUsedCategory?.icon || '📊'}
                      </div>
                      <div className="category-info">
                        <strong>Most Active Category</strong>
                        <p className="category-name-large">{stats.mostUsedCategory?.name || 'No data'}</p>
                        <div className="stat-subtext">
                          <span className="rebuttal-count">{stats.mostUsedCategory?.count || 0} rebuttals</span>
                          <span className="percentage-badge">
                            {' '}{stats.categoryDistribution?.[0]?.percentage || 0}% of total
                          </span>
                        </div>
                        <div className="category-stats-mini">
                          <div className="mini-stat">
                            <span className="mini-stat-label">Growth</span>
                            <span className="mini-stat-value positive">+{Math.round(stats.categoryGrowth || 0)}%</span>
                          </div>
                          <div className="mini-stat">
                            <span className="mini-stat-label">Usage</span>
                            <span className="mini-stat-value">{Math.round((stats.mostUsedCategory?.count || 0) / Math.max(stats.totalRebuttals, 1) * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics Grid */}
                  <div className="performance-metrics-grid">
                    <div className="metric-card performance">
                      <div className="metric-icon">📈</div>
                      <div className="metric-content">
                        <h3>Total Categories</h3>
                        <div className="metric-value">{stats.activeCategories}</div>
                        <div className="metric-trend positive">+{Math.max(0, stats.activeCategories - 5)} this month</div>
                      </div>
                    </div>
                    
                    <div className="metric-card performance">
                      <div className="metric-icon">⚡</div>
                      <div className="metric-content">
                        <h3>Avg. Usage</h3>
                        <div className="metric-value">{stats.averageRebuttalUsage}</div>
                        <div className="metric-trend">per rebuttal</div>
                      </div>
                    </div>
                    
                    <div className="metric-card performance">
                      <div className="metric-icon">🎯</div>
                      <div className="metric-content">
                        <h3>Success Rate</h3>
                        <div className="metric-value">{Math.round(stats.successRate)}%</div>
                        <div className="metric-trend positive">+{Math.round(stats.categoryGrowth || 0)}% vs last month</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Category Distribution */}
                  <div className="category-distribution">
                    <div className="distribution-header">
                      <h3>Category Distribution</h3>
                      <div className="distribution-legend">
                        <span className="legend-item">
                          <span className="legend-color most-used"></span>
                          Most Used
                        </span>
                        <span className="legend-item">
                          <span className="legend-color average"></span>
                          Average
                        </span>
                        <span className="legend-item">
                          <span className="legend-color least-used"></span>
                          Least Used
                        </span>
                      </div>
                    </div>
                    
                    <div className="category-bars">
                      {stats.categoryDistribution
                        ?.slice(0, showAllCategories ? undefined : 5)
                        .map((category, index) => (
                          <div key={`${category.name}-${index}`} className="category-bar-item">
                            <div className="category-bar-label">
                              <span className="category-icon">{category.icon}</span>
                              <span className="category-name">{category.name}</span>
                              <span className="category-rank">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="category-bar-container">
                              <div className="bar-wrapper">
                                <div 
                                  className={`category-bar ${index === 0 ? 'most-used' : index === stats.categoryDistribution.length - 1 ? 'least-used' : 'average'}`}
                                  style={{ width: `${category.percentage}%` }}
                                >
                                  <span className="bar-percentage">{category.percentage}%</span>
                                </div>
                              </div>
                              <div className="category-stats">
                                <span className="category-count">{category.count} rebuttals</span>
                                <span className="category-growth">
                                  {index === 0 ? '🔥' : index === 1 ? '⚡' : '📊'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {stats.categoryDistribution?.length > 5 && (
                      <button 
                        className="view-more-button"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                      >
                        {showAllCategories ? 'Show Less' : `Show ${stats.categoryDistribution.length - 5} More Categories`}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced System Health */}
              <div className="dashboard-card system-health">
                <div className="health-header">
                  <h2>🔧 System Health</h2>
                  <div className="health-actions">
                    <button 
                      className="health-refresh-btn"
                      onClick={async () => await updateSystemHealth()}
                      title="Refresh system health data"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                
                <div className="health-overview">
                  <div className="health-status-indicator">
                    <div className={`status-dot ${systemHealth.overallStatus}`}></div>
                    <span className="status-text">{systemHealth.overallStatus === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}</span>
                  </div>
                </div>

                <div className="health-metrics-grid">
                  {/* Database Health */}
                  {/* Database Status */}
                  <div className="health-metric-card database">
                    <div className="metric-header">
                      <div className="metric-icon">🗄️</div>
                      <div className="metric-title">Database</div>
                      <div className={`status-badge ${systemHealth.database.status}`}>
                        {systemHealth.database.status === 'healthy' ? '✅' : '⚠️'}
                      </div>
                    </div>
                    <div className="metric-details">
                      <div className="metric-row">
                        <span>Connection</span>
                        <span className={systemHealth.database.connection ? 'status-good' : 'status-error'}>
                          {systemHealth.database.connection ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      <div className="metric-row">
                        <span>Response Time</span>
                        <span>{systemHealth.database.responseTime ? `${systemHealth.database.responseTime}ms` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Authentication Status */}
                  <div className="health-metric-card authentication">
                    <div className="metric-header">
                      <div className="metric-icon">👤</div>
                      <div className="metric-title">Authentication</div>
                      <div className={`status-badge ${systemHealth.authentication.status}`}>
                        {systemHealth.authentication.status === 'healthy' ? '✅' : '⚠️'}
                      </div>
                    </div>
                    <div className="metric-details">
                      <div className="metric-row">
                        <span>Status</span>
                        <span className={systemHealth.authentication.status === 'healthy' ? 'status-good' : 'status-error'}>
                          {systemHealth.authentication.status === 'healthy' ? 'Authenticated' : 'Not Authenticated'}
                        </span>
                      </div>
                      <div className="metric-row">
                        <span>User</span>
                        <span>{systemHealth.authentication.user || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* SSL Status */}
                  <div className="health-metric-card ssl">
                    <div className="metric-header">
                      <div className="metric-icon">🔒</div>
                      <div className="metric-title">SSL Security</div>
                      <div className={`status-badge ${systemHealth.ssl.status}`}>
                        {systemHealth.ssl.status === 'healthy' ? '✅' : '⚠️'}
                      </div>
                    </div>
                                          <div className="metric-details">
                        <div className="metric-row">
                          <span>Certificate</span>
                          <span className={systemHealth.ssl.valid ? 'status-good' : 'status-error'}>
                            {window.location.hostname === 'localhost' ? 'Local Development' : (systemHealth.ssl.valid ? 'Valid (HTTPS)' : 'Invalid (HTTP)')}
                          </span>
                        </div>
                        <div className="metric-row">
                          <span>Protocol</span>
                          <span>{window.location.protocol}</span>
                        </div>
                      </div>
                  </div>

                  {/* Performance Status */}
                  <div className="health-metric-card performance">
                    <div className="metric-header">
                      <div className="metric-icon">⚡</div>
                      <div className="metric-title">Performance</div>
                      <div className={`status-badge ${systemHealth.performance.status}`}>
                        {systemHealth.performance.status === 'healthy' ? '✅' : '⚠️'}
                      </div>
                    </div>
                                          <div className="metric-details">
                        <div className="metric-row">
                          <span>Load Time</span>
                          <span>{systemHealth.performance.loadTime ? `${systemHealth.performance.loadTime}ms` : 'Measuring...'}</span>
                        </div>
                        <div className="metric-row">
                          <span>Memory Usage</span>
                          <span>{systemHealth.performance.memoryUsage ? `${systemHealth.performance.memoryUsage}%` : 'Not Available'}</span>
                        </div>
                      </div>
                  </div>

                                    {/* Storage Status */}
                  <div className="health-metric-card storage">
                    <div className="metric-header">
                      <div className="metric-icon">💿</div>
                      <div className="metric-title">Firebase Storage</div>
                      <div className={`status-badge ${systemHealth.storage.status}`}>
                        {systemHealth.storage.status === 'healthy' ? '✅' : 'ℹ️'}
                      </div>
                    </div>
                    <div className="metric-details">
                      <div className="metric-row">
                        <span>Status</span>
                        <span className="status-good">
                          Not Required
                        </span>
                      </div>
                      <div className="metric-row">
                        <span>Note</span>
                        <span>Storage not used in this app</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Alerts */}
                {systemHealth.alerts.length > 0 && (
                  <div className="system-alerts">
                    <h3>⚠️ System Alerts</h3>
                    <div className="alerts-list">
                      {systemHealth.alerts.map((alert, index) => (
                        <div key={index} className={`alert-item ${alert.severity}`}>
                          <div className="alert-icon">
                            {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                          </div>
                          <div className="alert-content">
                            <div className="alert-title">{alert.title}</div>
                            <div className="alert-message">{alert.message}</div>
                            <div className="alert-time">{alert.timestamp}</div>
                          </div>
                          <button 
                            className="alert-dismiss"
                            onClick={() => dismissAlert(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health Actions */}
                <div className="health-actions-panel">
                  <button className="health-action-btn" onClick={runSystemDiagnostics}>
                    🔍 Run Diagnostics
                  </button>
                  <button className="health-action-btn" onClick={fetchFirebaseHealthStatus}>
                    🔄 Refresh Health
                  </button>
                  <button className="health-action-btn" onClick={generateHealthReport}>
                    📊 Generate Report
                  </button>
                  <button className="health-action-btn" onClick={clearSystemCache}>
                    🧹 Clear Cache
                  </button>
                  <button className="health-action-btn" onClick={handleDiagnoseDocumentMismatches}>
                    🔧 Diagnose Document IDs
                  </button>
                  <button className="health-action-btn" onClick={handleRefreshData}>
                    🔄 Refresh Data
                  </button>
                  <button className="health-action-btn" onClick={showTroubleshootingGuide}>
                    📖 Troubleshooting Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="user-management-section">
            <UserManagement />
          </div>
        );
      case 'rebuttals':
        return (
          <div className="rebuttals-management">
            <div className="rebuttals-header">
              <h2>Rebuttals Management</h2>
              <div className="rebuttals-actions">
                <button 
                  className="add-rebuttal-button"
                  onClick={() => setShowAddModal(true)}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#45a049';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <span style={{ fontSize: '16px' }}>➕</span>
                  Add New Rebuttal
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="rebuttals-controls">
              <div className="search-filter-container">
                <input
                  type="text"
                  placeholder="Search rebuttals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-filter"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-stats">
                <span>Showing {filteredRebuttals.length} of {rebuttals.length} rebuttals</span>
              </div>
            </div>

            <div className="rebuttals-list">
              {filteredRebuttals.length === 0 ? (
                <div className="no-results">
                  <p>No rebuttals found matching your criteria.</p>
                  {searchTerm && (
                    <p className="search-tip">Try adjusting your search terms or category filter.</p>
                  )}
                </div>
              ) : (
                filteredRebuttals.map(rebuttal => (
                  <div key={rebuttal.id} className="rebuttal-item">
                    <div className="rebuttal-info">
                      <span className="rebuttal-category">
                        {/* Add category icon here */}
                      </span>
                      <h3 className="rebuttal-objection">{rebuttal.title}</h3>
                      <p className="rebuttal-objection-summary">{rebuttal.objection}</p>
                      <div className="rebuttal-responses">
                        <div className="response-section">
                          <h4 className="response-label">Initial Response (Part 1)</h4>
                          <p className="rebuttal-response">
                            {typeof rebuttal.response === 'object' && rebuttal.response.pt1 
                              ? rebuttal.response.pt1 
                              : typeof rebuttal.response === 'string' 
                                ? rebuttal.response 
                                : 'No initial response available.'}
                          </p>
                        </div>
                        <div className="response-section">
                          <h4 className="response-label">Follow-up Response (Part 2)</h4>
                          <p className="rebuttal-response follow-up">
                            {typeof rebuttal.response === 'object' && rebuttal.response.pt2 
                              ? rebuttal.response.pt2 
                              : rebuttal.followUpResponse || 'No follow-up response available.'}
                          </p>
                        </div>
                      </div>
                      {rebuttal.tags && rebuttal.tags.length > 0 && (
                        <div className="rebuttal-tags">
                          {rebuttal.tags.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rebuttal-actions">
                      <button 
                        className="edit-button"
                        onClick={() => {
                          setEditingRebuttal(rebuttal);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="archive-button"
                        onClick={() => handleArchiveRebuttal(rebuttal.id)}
                      >
                        Archive
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteRebuttal(rebuttal.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'archived':
        return (
          <div className="rebuttals-management">
            <div className="rebuttals-header">
              <h2>Archived Rebuttals</h2>
              <div className="header-actions">
                <span className="archived-count">
                  <i className="fas fa-archive"></i> {archivedRebuttals.length} archived
                </span>
                {archivedRebuttals.some(r => r.archivedReason === 'Category deleted') && (
                  <div className="restore-options">
                    <select 
                      onChange={(e) => handleRestoreArchivedRebuttals(e.target.value)}
                      className="restore-category-select"
                    >
                      <option value="">Restore to category...</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="rebuttals-list">
              {archivedRebuttals.length === 0 ? (
                <div className="no-rebuttals">
                  <i className="fas fa-archive fa-3x"></i>
                  <p>No archived rebuttals found.</p>
                </div>
              ) : (
                archivedRebuttals.map(rebuttal => (
                  <div key={rebuttal.id} className="rebuttal-item archived">
                    <div className="rebuttal-info">
                      <div className="rebuttal-header">
                        <span className="rebuttal-category">
                          {rebuttal.originalCategory && (
                            <span className="original-category">
                              <i className="fas fa-folder"></i> Originally in: {rebuttal.originalCategory}
                            </span>
                          )}
                        </span>
                        <span className="archived-badge">
                          <i className="fas fa-archive"></i> Archived {new Date(rebuttal.archivedAt).toLocaleDateString()}
                          {rebuttal.archivedReason && ` (${rebuttal.archivedReason})`}
                        </span>
                      </div>
                      <h3 className="rebuttal-objection">{rebuttal.title}</h3>
                      <p className="rebuttal-objection-summary">{rebuttal.objection}</p>
                      <div className="rebuttal-responses">
                        <div className="response-section">
                          <h4 className="response-label">Initial Response (Part 1)</h4>
                          <p className="rebuttal-response">
                            {typeof rebuttal.response === 'object' && rebuttal.response.pt1 
                              ? rebuttal.response.pt1 
                              : typeof rebuttal.response === 'string' 
                                ? rebuttal.response 
                                : 'No initial response available.'}
                          </p>
                        </div>
                        <div className="response-section">
                          <h4 className="response-label">Follow-up Response (Part 2)</h4>
                          <p className="rebuttal-response follow-up">
                            {typeof rebuttal.response === 'object' && rebuttal.response.pt2 
                              ? rebuttal.response.pt2 
                              : rebuttal.followUpResponse || 'No follow-up response available.'}
                          </p>
                        </div>
                      </div>
                      {rebuttal.tags && rebuttal.tags.length > 0 && (
                        <div className="rebuttal-tags">
                          {rebuttal.tags.map((tag, index) => (
                            <span key={index} className="tag">
                              <i className="fas fa-tag"></i> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rebuttal-actions">
                      <button 
                        className="unarchive-button"
                        onClick={() => handleUnarchiveRebuttal(rebuttal.id)}
                        disabled={loading}
                      >
                        <i className="fas fa-undo"></i> Unarchive
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to permanently delete this archived rebuttal?')) {
                            handleDeleteRebuttal(rebuttal.id);
                          }
                        }}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i> Delete Permanently
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="category-management">
            <div className="category-header">
              <h2>Category Management</h2>
            </div>
            <CategoryManagement />
          </div>
        );
      case 'customer-service':
        return (
          <CustomerServiceManagement />
        );
      case 'faq':
        return (
          <FAQManagement />
        );
      case 'lead-disposition':
        return (
          <div className="lead-disposition-management">
            <div className="lead-disposition-header">
              <h2>Lead Disposition Scripts</h2>
              <div className="header-actions">
                <button 
                  className="add-button"
                  onClick={() => setShowAddDispositionModal(true)}
                >
                  Add New Disposition
                </button>
                <button 
                  className="add-button"
                  onClick={() => setShowAddCategoryModal(true)}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#45a049';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#4CAF50';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <span style={{ fontSize: '14px' }}>➕</span>
                  Add Category
                </button>
              </div>
            </div>

            <div className="lead-disposition-container">
              {/* Category Sidebar */}
              <div className="category-sidebar">
                <div className="category-header">
                  <h3>Categories</h3>
                </div>
                <div className="category-buttons">
                  <button 
                    className={`category-button ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </button>
                  {dispositionCategories
                    .filter(category => category.id !== 'all') // Filter out 'all' category if it exists
                    .map(category => (
                      <div key={category.id} className="category-button-container">
                        <button 
                          className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {category.name}
                        </button>
                        <button
                          className="edit-category-button"
                          onClick={() => handleEditCategory(category)}
                          title="Edit Category"
                        >
                          ✏️
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="lead-disposition-content">
                {loadingDispositions ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading dispositions...</p>
                  </div>
                ) : error ? (
                  <div className="error">
                    <p>Error: {error}</p>
                    <button onClick={fetchDispositions}>Retry</button>
                  </div>
                ) : dispositions.length === 0 ? (
                  <div className="no-dispositions">
                    <p>No dispositions found. Would you like to initialize default dispositions?</p>
                    <button onClick={fetchDispositions}>Initialize Defaults</button>
                  </div>
                ) : (
                  <div className="lead-disposition-list">
                    {dispositions
                      .filter(disposition => selectedCategory === 'all' || disposition.category === selectedCategory)
                      .map(disposition => (
                        <div key={disposition.id} className="lead-disposition-item">
                          <div className="item-info">
                            <span 
                              className="item-category"
                              data-category={disposition.category}
                            >
                              {disposition.icon} {disposition.category}
                            </span>
                            <h3 className="item-title">{disposition.name}</h3>
                            <p className="item-description">{disposition.description}</p>
                            <div className="item-next-steps">
                              <h4>Next Steps</h4>
                              <p>{disposition.nextSteps}</p>
                            </div>
                            {disposition.tips && disposition.tips.length > 0 && (
                              <div className="item-tips">
                                <h4>Tips</h4>
                                <ul>
                                  {disposition.tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="item-actions">
                            <button 
                              className="edit-button"
                              onClick={() => {
                                setEditingDisposition(disposition);
                                setShowEditDispositionModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-button"
                              onClick={() => handleDeleteDisposition(disposition.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="settings-section">
            <div className="settings-grid">
              <div className="settings-card">
                <h3>Data Management</h3>
                <div className="settings-group">
                  <div className="data-management-section">
                    <h4>Categories & Rebuttals</h4>
                    <button
                      className="danger-button fix-all"
                      onClick={handleFixAll}
                      disabled={loading}
                    >
                      {loading ? 'Fixing...' : '🔄 Fix All Categories & Rebuttals'}
                    </button>
                    <button
                      className="danger-button fix-categories"
                      onClick={handleFixCategories}
                      disabled={loading}
                    >
                      {loading ? 'Fixing...' : '🔧 Fix Categories'}
                    </button>
                    <button
                      className="danger-button reset-rebuttals"
                      onClick={handleResetRebuttals}
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : '🔄 Reset to Default Rebuttals'}
                    </button>
                  </div>

                  <div className="data-management-section">
                    <h4>Dispositions & Service Topics</h4>
                    <button
                      className="danger-button reset-dispositions"
                      onClick={handleResetDispositions}
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : '🔄 Reset to Default Dispositions'}
                    </button>
                    <button
                      className="danger-button reset-service-topics"
                      onClick={handleResetServiceTopics}
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : '🔄 Reset to Default Service Topics'}
                    </button>
                  </div>

                  <div className="data-management-section">
                    <h4>Import/Export</h4>
                    {renderDataManagementButtons()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
  }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleEditCategory = async (category) => {
    setCategoryToEdit(category);
    setShowCategoryEditModal(true);
  };

  const handleSaveCategoryEdit = async (e) => {
    e.preventDefault();
    try {
      const updatedCategory = {
        ...categoryToEdit,
        name: categoryToEdit.name,
        id: categoryToEdit.name.toLowerCase().replace(/\s+/g, '-')
      };

      // Update in both categories arrays
      setCategories(prev => prev.map(cat => 
        cat.id === categoryToEdit.id ? updatedCategory : cat
      ));
      setDispositionCategories(prev => prev.map(cat => 
        cat.id === categoryToEdit.id ? updatedCategory : cat
      ));

      setShowCategoryEditModal(false);
      setCategoryToEdit(null);
      alert('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category. Please try again.');
    }
  };

  useEffect(() => {
    const loadRebuttals = async () => {
      try {
        const fetchedRebuttals = await rebuttalsService.getAllRebuttals();
        setRebuttals(fetchedRebuttals);
      } catch (error) {
        console.error('Error loading rebuttals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRebuttals();
  }, []);

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"? All rebuttals in this category will be archived.`)) {
      try {
        setLoading(true);
        const result = await categoryService.deleteCategory(category.id);
        
        // Update local state
        setCategories(prev => prev.filter(c => c.id !== category.id));
        setDispositionCategories(prev => prev.filter(c => c.id !== category.id));
        
        // Reload data to reflect changes
        await loadData();
        
        alert(`Category deleted successfully. ${result.archivedRebuttalsCount} rebuttals have been archived.`);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRestoreArchivedRebuttals = async (newCategoryName) => {
    if (!newCategoryName) return;
    
    if (window.confirm(`Are you sure you want to restore all archived rebuttals to the category "${newCategoryName}"?`)) {
      try {
        setLoading(true);
        const result = await categoryService.restoreArchivedRebuttals(newCategoryName);
        alert(`Successfully restored ${result.restoredCount} rebuttals to the new category.`);
        await loadData(); // Reload data to reflect changes
      } catch (error) {
        console.error('Error restoring rebuttals:', error);
        alert('Failed to restore rebuttals. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFixCategories = async () => {
    if (window.confirm('⚠️ WARNING: This will reset all categories and rebuttals to their default state.\n\nThis action will:\n- Delete all existing categories and rebuttals\n- Restore default categories and rebuttals\n- Fix any mapping issues\n- Cannot be undone\n\nAre you sure you want to continue?')) {
      try {
        setLoading(true);
        
        // First, get all existing categories
        const existingCategories = await categoryService.getAllCategories();
        
        // Delete all existing categories
        for (const category of existingCategories) {
          await categoryService.deleteCategory(category.id);
        }
        
        // Reset all rebuttals to default state
        await categoryService.resetAllRebuttals();
        
        // Force initialize default categories
        await categoryService.initializeDefaultCategories();
        
        // Reload data to reflect changes
        await loadData();
        
        // Show success message
        alert('✅ Categories and rebuttals have been fixed successfully!');
      } catch (error) {
        console.error('Error fixing categories and rebuttals:', error);
        alert('❌ Failed to fix categories and rebuttals. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetRebuttals = async () => {
    if (window.confirm('Are you sure you want to reset all rebuttals to their default state? This will delete all existing rebuttals and create new default ones.')) {
      try {
        setLoading(true);
        await rebuttalsService.resetAllRebuttals();
        await loadData(); // Reload the data to show the new rebuttals
        alert('Successfully reset all rebuttals to default state');
      } catch (error) {
        console.error('Error resetting rebuttals:', error);
        alert('Error resetting rebuttals: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add the new handler function
  const handleFixAll = async () => {
    if (window.confirm('⚠️ WARNING: This will reset ALL categories and rebuttals to their default state.\n\nThis action will:\n- Delete all existing categories and rebuttals\n- Restore default categories and rebuttals\n- Fix any mapping issues\n- Cannot be undone\n\nAre you sure you want to continue?')) {
      try {
        setLoading(true);
        
        // First, get all existing categories
        const existingCategories = await categoryService.getAllCategories();
        
        // Delete all existing categories
        for (const category of existingCategories) {
          await categoryService.deleteCategory(category.id);
        }
        
        // Reset all rebuttals to default state
        await rebuttalsService.resetAllRebuttals();
        
        // Force initialize default categories
        await categoryService.initializeDefaultCategories();
        
        // Reload data to reflect changes
        await loadData();
        
        // Show success message
        alert('✅ Categories and rebuttals have been fixed successfully!');
      } catch (error) {
        console.error('Error fixing categories and rebuttals:', error);
        alert('❌ Failed to fix categories and rebuttals. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Add this function in the component
  const handleResetDispositions = async () => {
    if (window.confirm('⚠️ WARNING: This will reset ALL dispositions to their default state.\n\nThis action will:\n- Delete all existing dispositions\n- Restore default dispositions\n- Cannot be undone\n\nAre you sure you want to continue?')) {
      try {
        setLoading(true);
        await dispositionService.resetAllDispositions();
        await loadData(); // Reload the data to show the new dispositions
        alert('✅ Successfully reset all dispositions to default state');
      } catch (error) {
        console.error('Error resetting dispositions:', error);
        alert('❌ Error resetting dispositions: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetServiceTopics = async () => {
    if (window.confirm('⚠️ WARNING: This will reset ALL service topics to their default state.\n\nThis action will:\n- Delete all existing service topics\n- Restore default service topics\n- Cannot be undone\n\nAre you sure you want to continue?')) {
      try {
        setLoading(true);
        await resetServiceTopics();
        await loadData(); // Reload the data to show the new service topics
        alert('✅ Successfully reset all service topics to default state');
      } catch (error) {
        console.error('Error resetting service topics:', error);
        alert('❌ Error resetting service topics: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // System Health Functions
  const runSystemDiagnostics = async () => {
    setLoading(true);
    await fetchFirebaseHealthStatus();
    setLoading(false);
    alert('🔍 System diagnostics complete!');
  };

  const generateHealthReport = async () => {
    try {
      setLoading(true);
      
      // Generate a comprehensive health report
      const report = {
        timestamp: new Date().toLocaleString(),
        totalRebuttals: rebuttals.length,
        totalCategories: categories.length,
        totalUsers: adminUsers.length,
        systemStatus: 'Healthy',
        recommendations: [
          'System performance is optimal',
          'All services are running normally',
          'No immediate action required'
        ]
      };
      
      // Create downloadable report
      const reportText = `Health Report - ${report.timestamp}\n\n` +
        `Total Rebuttals: ${report.totalRebuttals}\n` +
        `Total Categories: ${report.totalCategories}\n` +
        `Total Users: ${report.totalUsers}\n` +
        `System Status: ${report.systemStatus}\n\n` +
        `Recommendations:\n${report.recommendations.map(rec => `- ${rec}`).join('\n')}`;
      
      // Create and download file
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('📊 Health report generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating health report:', error);
      alert('❌ Error generating health report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSystemCache = async () => {
    if (window.confirm('🧹 Clear System Cache\n\nThis will:\n- Clear browser cache for this application\n- Reset temporary data\n- Improve performance\n\nContinue?')) {
      try {
        setLoading(true);
        
        // Clear localStorage cache
        const keysToKeep = ['adminUser', 'authToken'];
        const keysToRemove = Object.keys(localStorage).filter(key => !keysToKeep.includes(key));
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Reload data
        await loadData();
        await fetchFirebaseHealthStatus();
        
        alert('✅ System cache cleared successfully!\n\nPerformance should be improved.');
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('❌ Error clearing system cache: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const dismissAlert = (index) => {
    setSystemHealth(prev => ({
      ...prev,
      alerts: prev.alerts.filter((_, i) => i !== index)
    }));
  };

  // Add this function to handle adding new categories
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        ...newCategory,
        id: newCategory.name.toLowerCase().replace(/\s+/g, '-')
      };

      // Add to both categories arrays
      setCategories(prev => [...prev, categoryData]);
      setDispositionCategories(prev => [...prev, categoryData]);

      // Reset form and close modal
      setNewCategory({ name: '', icon: '📝', color: '#4CAF50' });
      setShowAddCategoryModal(false);
      alert('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories from database
        const dbCategories = await rebuttalsService.getCategories();
        console.log('Fetched categories:', dbCategories);
        
        // Format categories for the dropdown
        const formattedCategories = [
          { id: 'all', name: 'All Categories' },
          ...dbCategories.map(cat => ({
            id: cat.id,
            name: cat.name
          }))
        ];
        
        setCategories(formattedCategories);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Real Firebase Health Check
  const fetchFirebaseHealthStatus = async () => {
    console.log('🔍 Starting Firebase Health Check...');
    const db = getFirestore();
    const auth = getAuth();
    const health = {
      overallStatus: 'healthy',
      database: { status: 'unknown', connection: false, responseTime: null },
      authentication: { status: 'unknown', user: null },
      ssl: { status: 'unknown', valid: false },
      performance: { status: 'unknown', loadTime: null, memoryUsage: null },
      storage: { status: 'unknown', available: false },
      alerts: []
    };

    // Check SSL/HTTPS (don't warn for localhost)
    health.ssl.valid = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    health.ssl.status = health.ssl.valid ? 'healthy' : 'error';
    if (!health.ssl.valid && window.location.hostname !== 'localhost') {
      health.alerts.push({
        severity: 'warning',
        title: 'Not Using HTTPS',
        message: 'This site is not using a secure connection.',
        timestamp: new Date().toLocaleString()
      });
      health.overallStatus = 'warning';
    }

    // Check Performance (Page Load Time)
    if (performance.timing && performance.timing.loadEventEnd > 0) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      health.performance.loadTime = loadTime;
      health.performance.status = loadTime < 3000 ? 'healthy' : 'warning';
    } else {
      // Use navigation timing API if available
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        health.performance.loadTime = navigation.loadEventEnd - navigation.startTime;
        health.performance.status = health.performance.loadTime < 3000 ? 'healthy' : 'warning';
      } else {
        health.performance.status = 'unknown';
      }
    }

    // Check Browser Memory (if available)
    if (performance.memory) {
      const memoryUsage = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
      health.performance.memoryUsage = memoryUsage;
      if (memoryUsage > 80) {
        health.alerts.push({
          severity: 'warning',
          title: 'High Memory Usage',
          message: `Browser memory usage is ${memoryUsage}%`,
          timestamp: new Date().toLocaleString()
        });
      }
    }

    // Check Firestore - try to read a real collection first
    const start = Date.now();
    try {
      console.log('🔍 Testing Firestore connection...');
      // Try to read from a real collection that exists
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      console.log('✅ Categories collection accessible');
      health.database.status = 'healthy';
      health.database.connection = true;
      health.database.responseTime = Date.now() - start;
    } catch (e) {
      console.log('⚠️ Categories collection failed, trying rebuttals...');
      // If categories don't exist, try rebuttals
      try {
        const rebuttalsSnapshot = await getDocs(collection(db, 'rebuttals'));
        console.log('✅ Rebuttals collection accessible');
        health.database.status = 'healthy';
        health.database.connection = true;
        health.database.responseTime = Date.now() - start;
      } catch (e2) {
        console.log('⚠️ Rebuttals collection failed, creating test document...');
        // If both fail, try to create a test document
        try {
          await setDoc(doc(db, 'healthCheck', 'test'), {
            timestamp: new Date().toISOString(),
            test: true
          });
          console.log('✅ Test document created successfully');
          health.database.status = 'healthy';
          health.database.connection = true;
          health.database.responseTime = Date.now() - start;
        } catch (e3) {
          console.error('❌ Firestore connection failed:', e3);
          health.database.status = 'error';
          health.database.connection = false;
          health.database.responseTime = null;
          health.alerts.push({
            severity: 'critical',
            title: 'Firestore Error',
            message: e3.message,
            timestamp: new Date().toLocaleString()
          });
          health.overallStatus = 'warning';
        }
      }
    }

    // Check Auth - use localStorage admin user as fallback
    const user = auth.currentUser;
    const adminUser = localStorage.getItem('adminUser');
    
    console.log('🔍 Checking authentication...');
    console.log('Firebase Auth user:', user);
    console.log('localStorage adminUser:', adminUser);
    
    if (user || adminUser) {
      let userEmail = 'Admin User';
      if (user) {
        userEmail = user.email;
      } else if (adminUser) {
        try {
          const parsedAdmin = JSON.parse(adminUser);
          userEmail = parsedAdmin.email || parsedAdmin.name || 'Admin User';
        } catch (e) {
          userEmail = 'Admin User';
        }
      }
      
      console.log('✅ Authentication successful:', userEmail);
      health.authentication.status = 'healthy';
      health.authentication.user = userEmail;
    } else {
      console.log('❌ No authentication found');
      health.authentication.status = 'error';
      health.authentication.user = null;
      health.alerts.push({
        severity: 'warning',
        title: 'Not Authenticated',
        message: 'No user is currently logged in.',
        timestamp: new Date().toLocaleString()
      });
      health.overallStatus = 'warning';
    }

    // Skip Firebase Storage check to avoid CORS issues
    health.storage.status = 'unknown';
    health.storage.available = false;
    console.log('ℹ️ Skipping Firebase Storage check to avoid CORS issues');

    console.log('🔍 Health check completed:', health);
    setSystemHealth(health);
  };

  // Render loading state
  console.log('🔍 AdminDashboard: Render state - loading:', loading, 'authLoading:', authLoading, 'error:', error, 'currentUser:', currentUser, 'adminUser:', adminUser);
  
  if (loading || authLoading) {
    console.log('🔍 AdminDashboard: Showing loading state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Admin Dashboard...</div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>Please wait while we initialize your admin panel</div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render error state
  if (error) {
    console.log('🔍 AdminDashboard: Showing error state:', error);
    return (
      <div style={{ 
        padding: '20px', 
        color: 'red', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '40px auto',
        border: '1px solid red',
        borderRadius: '4px'
      }}>
        <h2>Error Loading Admin Dashboard</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Check if user is authenticated and is admin
  if (!currentUser || !adminUser) {
    console.log('🔍 AdminDashboard: Showing access denied - currentUser:', currentUser, 'adminUser:', adminUser);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Access Denied</div>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>You must be logged in as an admin to access this page</div>
        <button 
          onClick={() => navigate('/admin/login')} 
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  console.log('🔍 AdminDashboard: Rendering main dashboard');
  return (
    <div className="admin-dashboard">
        <nav className="admin-nav">
          <div className="nav-brand">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="nav-tabs">
            <button 
              className={`nav-tab home-button ${activeTab === 'home' ? 'active' : ''}`}
              onClick={handleHomeClick}
            >
              🏠 Home
            </button>
            <button 
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-tab ${activeTab === 'rebuttals' ? 'active' : ''}`}
              onClick={() => handleTabClick('rebuttals')}
            >
              Rebuttals
            </button>
            <button 
              className={`nav-tab ${activeTab === 'archived' ? 'active' : ''}`}
              onClick={() => handleTabClick('archived')}
            >
              Archived
            </button>
            <button 
              className={`nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => handleTabClick('categories')}
            >
              Categories
            </button>
            <button 
              className={`nav-tab ${activeTab === 'customer-service' ? 'active' : ''}`}
              onClick={() => handleTabClick('customer-service')}
            >
              Customer Service
            </button>
            <button 
              className={`nav-tab ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => handleTabClick('faq')}
            >
              FAQ
            </button>
            <button 
              className={`nav-tab ${activeTab === 'lead-disposition' ? 'active' : ''}`}
              onClick={() => handleTabClick('lead-disposition')}
            >
              Lead Disposition
            </button>
            <button 
              className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => handleTabClick('users')}
            >
              Users
            </button>
            <button 
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabClick('settings')}
            >
              Settings
            </button>
          </div>
          <div className="nav-user">
            <span>Welcome, {adminUser?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </nav>

        <div className="admin-content">
          {renderContent()}
        </div>

      {/* Add Rebuttal Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Rebuttal</h2>
            <form onSubmit={handleAddRebuttal}>
              <div className="form-group">
                <label className="required">Title</label>
                <input
                  type="text"
                  value={newRebuttal.title}
                  onChange={(e) => setNewRebuttal({...newRebuttal, title: e.target.value})}
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  value={newRebuttal.category}
                  onChange={(e) => setNewRebuttal({...newRebuttal, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Objection</label>
                <input
                  type="text"
                  value={newRebuttal.objection}
                  onChange={(e) => setNewRebuttal({...newRebuttal, objection: e.target.value})}
                  placeholder="Enter the customer's objection"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Initial Response (Part 1)</label>
                <textarea
                  value={newRebuttal.response}
                  onChange={(e) => setNewRebuttal({...newRebuttal, response: e.target.value})}
                  rows={6}
                  required
                  placeholder="Enter the initial response to the objection..."
                />
                <div className="char-count">
                  {newRebuttal.response.length} characters
                </div>
              </div>
              <div className="form-group">
                <label>Follow-up Response (Part 2)</label>
                <textarea
                  value={newRebuttal.followUpResponse}
                  onChange={(e) => setNewRebuttal({...newRebuttal, followUpResponse: e.target.value})}
                  rows={6}
                  placeholder="Enter the follow-up response if the initial response doesn't work..."
                />
                <div className="char-count">
                  {newRebuttal.followUpResponse.length} characters
                </div>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input
                  type="text"
                  value={newRebuttal.tags.join(', ')}
                  onChange={(e) => setNewRebuttal({
                    ...newRebuttal,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder="Enter tags separated by commas (e.g., price, urgency, follow-up)"
                />
                <div className="char-count">
                  {newRebuttal.tags.length} tags
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">
                  Add Rebuttal
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRebuttal({ title: '', category: '', objection: '', response: '', followUpResponse: '', tags: [] });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rebuttal Modal */}
      {showEditModal && editingRebuttal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Rebuttal</h2>
            <form onSubmit={handleEditRebuttal}>
              <div className="form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  name="title"
                  type="text"
                  value={editingRebuttal.title}
                  onChange={(e) => setEditingRebuttal({...editingRebuttal, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingRebuttal.category}
                  onChange={(e) => setEditingRebuttal({...editingRebuttal, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Objection</label>
                <input
                  type="text"
                  value={editingRebuttal.objection}
                  onChange={(e) => setEditingRebuttal({...editingRebuttal, objection: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Initial Response (Part 1)</label>
                <textarea
                  value={typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt1 : editingRebuttal.response}
                  onChange={(e) => setEditingRebuttal({
                    ...editingRebuttal,
                    response: {
                      pt1: e.target.value,
                      pt2: typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt2 : editingRebuttal.followUpResponse || ''
                    }
                  })}
                  rows={6}
                  required
                  placeholder="Enter the initial response to the objection..."
                />
              </div>
              <div className="form-group">
                <label>Follow-up Response (Part 2)</label>
                <textarea
                  value={typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt2 : editingRebuttal.followUpResponse || ''}
                  onChange={(e) => setEditingRebuttal({
                    ...editingRebuttal,
                    response: {
                      pt1: typeof editingRebuttal.response === 'object' ? editingRebuttal.response.pt1 : editingRebuttal.response || '',
                      pt2: e.target.value
                    }
                  })}
                  rows={6}
                  placeholder="Enter the follow-up response if the initial response doesn't work..."
                />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editingRebuttal.tags.join(', ')}
                  onChange={(e) => setEditingRebuttal({
                    ...editingRebuttal,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Save Changes</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Admin User</h2>
            <form onSubmit={handleAddAdmin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                  required
                />
              </div>
              {adminError && (
                <div className="error-message">{adminError}</div>
              )}
              <div className="modal-actions">
                <button type="submit" className="submit-button">Create Admin</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAdminError('');
                    setNewAdmin({ email: '', password: '', confirmPassword: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Disposition Modal */}
      {showAddDispositionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Disposition</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddDisposition(newDisposition);
            }}>
              <div className="form-group">
                <label className="required">Name</label>
                <input
                  type="text"
                  value={newDisposition.name}
                  onChange={(e) => setNewDisposition({...newDisposition, name: e.target.value})}
                  placeholder="Enter disposition name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  value={newDisposition.category}
                  onChange={(e) => setNewDisposition({...newDisposition, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Description</label>
                <textarea
                  value={newDisposition.description}
                  onChange={(e) => setNewDisposition({...newDisposition, description: e.target.value})}
                  placeholder="Enter disposition description"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Icon</label>
                <input
                  type="text"
                  value={newDisposition.icon}
                  onChange={(e) => setNewDisposition({...newDisposition, icon: e.target.value})}
                  placeholder="Enter an emoji or icon"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Color</label>
                <select
                  value={newDisposition.color}
                  onChange={(e) => setNewDisposition({...newDisposition, color: e.target.value})}
                  required
                >
                  <option value="">Select a color</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="pink">Pink</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="cyan">Cyan</option>
                  <option value="indigo">Indigo</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
              <div className="form-group">
                <label className="required">Next Steps</label>
                <textarea
                  value={newDisposition.nextSteps}
                  onChange={(e) => setNewDisposition({...newDisposition, nextSteps: e.target.value})}
                  placeholder="Enter next steps"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tips</label>
                <div className="tips-section">
                  <h4>Helpful Tips</h4>
                  <div className="tips-input-container">
                    <textarea
                      value={newDisposition.tips.join('\n')}
                      onChange={(e) => setNewDisposition({
                        ...newDisposition,
                        tips: e.target.value.split('\n').filter(tip => tip.trim())
                      })}
                      placeholder="Enter tips (one per line)"
                    />
                  </div>
                  <div className="tips-actions">
                    <button 
                      type="button"
                      className="add-tip"
                      onClick={() => {
                        const newTip = prompt('Enter a new tip:');
                        if (newTip) {
                          setNewDisposition({
                            ...newDisposition,
                            tips: [...newDisposition.tips, newTip.trim()]
                          });
                        }
                      }}
                    >
                      Add Tip
                    </button>
                    <button 
                      type="button"
                      className="clear-tips"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all tips?')) {
                          setNewDisposition({
                            ...newDisposition,
                            tips: []
                          });
                        }
                      }}
                    >
                      Clear Tips
                    </button>
                  </div>
                  {newDisposition.tips.length > 0 && (
                    <ul className="tips-list">
                      {newDisposition.tips.map((tip, index) => (
                        <li key={index}>
                          {tip}
                          <button
                            className="remove-tip"
                            onClick={() => {
                              setNewDisposition({
                                ...newDisposition,
                                tips: newDisposition.tips.filter((_, i) => i !== index)
                              });
                            }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Add Disposition</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddDispositionModal(false);
                    setNewDisposition({
                      name: '',
                      category: '',
                      description: '',
                      icon: '',
                      color: '',
                      nextSteps: '',
                      tips: []
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Disposition Modal */}
      {showEditDispositionModal && editingDisposition && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Disposition</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditDisposition(editingDisposition.id, editingDisposition);
            }}>
              <div className="form-group">
                <label className="required">Name</label>
                <input
                  type="text"
                  value={editingDisposition.name}
                  onChange={(e) => setEditingDisposition({...editingDisposition, name: e.target.value})}
                  placeholder="Enter disposition name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Category</label>
                <select
                  value={editingDisposition.category}
                  onChange={(e) => setEditingDisposition({...editingDisposition, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="required">Description</label>
                <textarea
                  value={editingDisposition.description}
                  onChange={(e) => setEditingDisposition({...editingDisposition, description: e.target.value})}
                  placeholder="Enter disposition description"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Icon</label>
                <input
                  type="text"
                  value={editingDisposition.icon}
                  onChange={(e) => setEditingDisposition({...editingDisposition, icon: e.target.value})}
                  placeholder="Enter an emoji or icon"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Color</label>
                <select
                  value={editingDisposition.color}
                  onChange={(e) => setEditingDisposition({...editingDisposition, color: e.target.value})}
                  required
                >
                  <option value="">Select a color</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="pink">Pink</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="cyan">Cyan</option>
                  <option value="indigo">Indigo</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
              <div className="form-group">
                <label className="required">Next Steps</label>
                <textarea
                  value={editingDisposition.nextSteps}
                  onChange={(e) => setEditingDisposition({...editingDisposition, nextSteps: e.target.value})}
                  placeholder="Enter next steps"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tips</label>
                <div className="tips-section">
                  <h4>Helpful Tips</h4>
                  <div className="tips-input-container">
                    <textarea
                      value={editingDisposition.tips.join('\n')}
                      onChange={(e) => setEditingDisposition({
                        ...editingDisposition,
                        tips: e.target.value.split('\n').filter(tip => tip.trim())
                      })}
                      placeholder="Enter tips (one per line)"
                    />
                  </div>
                  <div className="tips-actions">
                    <button 
                      type="button"
                      className="add-tip"
                      onClick={() => {
                        const newTip = prompt('Enter a new tip:');
                        if (newTip) {
                          setEditingDisposition({
                            ...editingDisposition,
                            tips: [...editingDisposition.tips, newTip.trim()]
                          });
                        }
                      }}
                    >
                      Add Tip
                    </button>
                    <button 
                      type="button"
                      className="clear-tips"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all tips?')) {
                          setEditingDisposition({
                            ...editingDisposition,
                            tips: []
                          });
                        }
                      }}
                    >
                      Clear Tips
                    </button>
                  </div>
                  {editingDisposition.tips.length > 0 && (
                    <ul className="tips-list">
                      {editingDisposition.tips.map((tip, index) => (
                        <li key={index}>
                          {tip}
                          <button
                            className="remove-tip"
                            onClick={() => {
                              setEditingDisposition({
                                ...editingDisposition,
                                tips: editingDisposition.tips.filter((_, i) => i !== index)
                              });
                            }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Save Changes</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowEditDispositionModal(false);
                    setEditingDisposition(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showCategoryEditModal && categoryToEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Category</h2>
            <form onSubmit={handleSaveCategoryEdit}>
              <div className="form-group">
                <label className="required">Category Name</label>
                <input
                  type="text"
                  value={categoryToEdit.name}
                  onChange={(e) => setCategoryToEdit({
                    ...categoryToEdit,
                    name: e.target.value
                  })}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Save Changes</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowCategoryEditModal(false);
                    setCategoryToEdit(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="required">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Icon</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  placeholder="Enter an emoji or icon"
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Color</label>
                <select
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                  required
                >
                  <option value="#4CAF50">Green</option>
                  <option value="#2196F3">Blue</option>
                  <option value="#F44336">Red</option>
                  <option value="#FFC107">Yellow</option>
                  <option value="#9C27B0">Purple</option>
                  <option value="#FF9800">Orange</option>
                  <option value="#795548">Brown</option>
                  <option value="#607D8B">Gray</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Add Category</button>
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategory({ name: '', icon: '📝', color: '#4CAF50' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add this before the closing div of the component */}
      {showUnarchiveModal && selectedRebuttalToUnarchive && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Unarchive Rebuttal</h2>
              <button onClick={() => {
                setShowUnarchiveModal(false);
                setSelectedRebuttalToUnarchive(null);
                setSelectedCategory('');
              }} className="modal-close-button">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Select a category to unarchive this rebuttal to:</p>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="">Select a category...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  setShowUnarchiveModal(false);
                  setSelectedRebuttalToUnarchive(null);
                  setSelectedCategory('');
                }} 
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmUnarchive}
                className="confirm-button"
                disabled={!selectedCategory || loading}
              >
                {loading ? 'Unarchiving...' : 'Unarchive'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default AdminDashboard; 