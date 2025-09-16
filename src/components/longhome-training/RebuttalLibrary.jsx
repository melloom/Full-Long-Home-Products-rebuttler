import React, { useState, useEffect, useCallback, useMemo } from 'react';
import categoryService from '../../services/categoryService';
import './RebuttalLibrary.css';
import Header from './Header';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getDb } from '../../services/firebase/config';
import rebuttalsService from '../../services/rebuttalsService';
import SearchBar from './SearchBar';

const DEFAULT_TIPS = [
  "Listen actively and acknowledge the customer's concerns",
  "Stay calm and professional throughout the conversation",
  "Use positive language and focus on solutions",
  "Be prepared with relevant information and examples",
  "Follow up appropriately if needed"
];

const RebuttalLibrary = ({ onNavigate, searchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRebuttal, setSelectedRebuttal] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [showModal, setShowModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [urgentRebuttal, setUrgentRebuttal] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allRebuttals, setAllRebuttals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [error, setError] = useState(null);
  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    // Force dark theme while using rebuttal library/modal so tips use dark styles
    document.body.classList.add('dark');
    return () => {
      document.body.classList.remove('dark');
    };
  }, []);

  useEffect(() => {
    if (showModal) {
      // Simply prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll when modal closes
        document.body.style.overflow = '';
      };
    }
  }, [showModal]);

  // Helper to normalize various content shapes into { pt1, pt2 }
  const normalizeContent = useCallback((rebuttal) => {
    const pick = (obj, keys) => {
      for (const k of keys) {
        if (obj && obj[k]) return obj[k];
      }
      return '';
    };

    const c = rebuttal?.content && typeof rebuttal.content === 'object' ? rebuttal.content : {};
    const r = rebuttal?.response && typeof rebuttal.response === 'object' ? rebuttal.response : {};

    const pt1 = typeof rebuttal?.content === 'string'
      ? rebuttal.content
      : pick(c, ['pt1','initial','part1','content1','first','opening'])
        || pick(r, ['pt1','initial','part1','content1','first','opening'])
        || rebuttal?.summary || rebuttal?.objection || '';

    const pt2 = pick(c, ['pt2','followup','followUp','part2','content2','second','closing'])
        || pick(r, ['pt2','followup','followUp','part2','content2','second','closing'])
        || '';

    return { ...rebuttal, content: { pt1, pt2 } };
  }, []);

  useEffect(() => {
    // Set up real-time listener for rebuttals
    const rebuttalsQuery = query(
      collection(getDb(), 'rebuttals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(rebuttalsQuery, (snapshot) => {
      const updatedRebuttals = snapshot.docs.map(doc => normalizeContent({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Firestore rebuttals (normalized):', updatedRebuttals);
      setAllRebuttals(updatedRebuttals);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to rebuttals:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [normalizeContent]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch rebuttals
        const rebuttals = await rebuttalsService.getAllRebuttals();
        console.log('Raw rebuttals data:', rebuttals);
        const normalizedRebuttals = rebuttals.map(normalizeContent);
        setAllRebuttals(normalizedRebuttals);

        // Fetch categories from database
        const dbCategories = await rebuttalsService.getCategories();
        console.log('Raw categories data:', dbCategories);
        
        // Create a mapping of category names to IDs
        const categoryNameToId = dbCategories.reduce((acc, cat) => {
          const normalizedName = cat.name.toLowerCase().replace(/\s+/g, '-');
          acc[normalizedName] = cat.id;
          acc[cat.name.toLowerCase()] = cat.id; // Add direct name mapping
          console.log(`Mapping category: ${cat.name} -> ${cat.id}`);
          return acc;
        }, {});

        // Create a mapping of category IDs to names
        const categoryIdToName = dbCategories.reduce((acc, cat) => {
          acc[cat.id] = cat.name;
          console.log(`Reverse mapping: ${cat.id} -> ${cat.name}`);
          return acc;
        }, {});

        // Update rebuttals with proper category IDs
        const updatedRebuttals = normalizedRebuttals.map(rebuttal => {
          if (rebuttal.category) {
            // Try different ways to match the category
            let categoryId = rebuttal.category;
            
            // If it's already an ID, verify it exists
            if (categoryIdToName[categoryId]) {
              console.log(`Rebuttal "${rebuttal.title}" already has valid category ID: ${categoryId}`);
              return rebuttal;
            }
            
            // Try matching by normalized name
            const normalizedCategory = rebuttal.category.toLowerCase().replace(/\s+/g, '-');
            categoryId = categoryNameToId[normalizedCategory];
            
            // Try matching by direct name
            if (!categoryId) {
              categoryId = categoryNameToId[rebuttal.category.toLowerCase()];
            }
            
            if (categoryId) {
              console.log(`Mapped rebuttal "${rebuttal.title}" from category "${rebuttal.category}" to ID: ${categoryId}`);
              return { ...rebuttal, category: categoryId };
            } else {
              console.log(`No matching category ID found for rebuttal "${rebuttal.title}" with category "${rebuttal.category}"`);
            }
          }
          return rebuttal;
        });
        
        console.log('Updated rebuttals with category mappings:', updatedRebuttals.map(r => ({
          title: r.title,
          originalCategory: r.category,
          mappedCategory: categoryIdToName[r.category]
        })));
        
        setAllRebuttals(updatedRebuttals);

        const formattedCategories = [
          { id: 'all', name: 'All Categories', icon: '📋', color: 'gray' },
          ...dbCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '📋',
            color: getCategoryColor(cat.id)
          }))
        ];
        setCategories(formattedCategories);

        // Debug log for category mapping
        console.log('Category Mapping:', {
          nameToId: categoryNameToId,
          idToName: categoryIdToName,
          rebuttals: updatedRebuttals.map(r => ({
            title: r.title,
            category: r.category,
            categoryName: categoryIdToName[r.category]
          }))
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load rebuttals and categories');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to get category color
  const getCategoryColor = (categoryId) => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'teal', 'indigo', 'cyan'];
    const index = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // Remove hardcoded commonObjectionCategories
  const commonObjectionCategories = categories
    .filter(cat => cat.id !== 'all')
    .map(cat => cat.id);

  // Remove hardcoded urgentRebuttalTopics
  const urgentRebuttalTopics = allRebuttals
    .filter(rebuttal => rebuttal.isUrgent)
    .map(rebuttal => ({
      id: rebuttal.id,
      topic: 'rebuttals',
      title: rebuttal.title,
      description: rebuttal.summary,
      steps: rebuttal.steps || [],
      tips: rebuttal.tips || [],
      keywords: rebuttal.tags || [],
      isUrgent: true
    }));

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Get semantic score for search relevance
  const getSemanticScore = (query, text) => {
    const queryWords = query.toLowerCase().split(' ');
    const textWords = text.toLowerCase().split(' ');
    let score = 0;

    queryWords.forEach(word => {
      textWords.forEach(textWord => {
        if (textWord.includes(word) || word.includes(textWord)) {
          score += 1;
        }
      });
    });

    return score / queryWords.length;
  };

  // Perform intelligent search
  const performIntelligentSearch = (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = [];
    const searchTerms = query.toLowerCase().split(' ');

    allRebuttals.forEach(rebuttal => {
      const titleScore = getSemanticScore(query, rebuttal.title);
      const summaryScore = getSemanticScore(query, rebuttal.summary);
      const tagsScore = rebuttal.tags.reduce((score, tag) => 
        score + getSemanticScore(query, tag), 0) / rebuttal.tags.length;
      
      const contentScore = rebuttal.content && rebuttal.content.pt1 ? 
        getSemanticScore(query, rebuttal.content.pt1) : 0;
      const content2Score = rebuttal.content && rebuttal.content.pt2 ? 
        getSemanticScore(query, rebuttal.content.pt2) : 0;

      const relevanceScore = Math.max(
        titleScore * 2, // Title matches are more important
        summaryScore,
        tagsScore,
        contentScore,
        content2Score
      );

      if (relevanceScore > 0.3) {
        suggestions.push({
          ...rebuttal,
          relevanceScore
        });
      }
    });

    // Sort by relevance score
    suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
    setSearchSuggestions(suggestions);
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      performIntelligentSearch(query);
    }, 300),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    debouncedSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchSuggestions.length) {
          handleSuggestionClick(searchSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.title);
    setShowSuggestions(false);
    setSelectedRebuttal(suggestion);
    setShowModal(true);
  };

  const filteredRebuttals = useMemo(() => {
    if (selectedCategory === 'all') {
      return allRebuttals;
    }
    return allRebuttals.filter(rebuttal => rebuttal.category === selectedCategory);
  }, [selectedCategory, allRebuttals]);

  // Debug effect to track state changes - only log important updates
  useEffect(() => {
    const categoryStats = allRebuttals.reduce((acc, rebuttal) => {
      const category = rebuttal.category || 'uncategorized';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          rebuttals: []
        };
      }
      acc[category].count++;
      acc[category].rebuttals.push(rebuttal.title);
      return acc;
    }, {});

    // Only log when category changes or rebuttals are updated
    console.log('Category Update:', {
      selectedCategory,
      totalRebuttals: allRebuttals.length,
      filteredCount: filteredRebuttals.length,
      categoryCount: categoryStats[selectedCategory]?.count || 0
    });
  }, [selectedCategory, allRebuttals, filteredRebuttals]);

  const openModal = (rebuttal) => {
    setSelectedRebuttal(rebuttal);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRebuttal(null);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setUrgentRebuttal(action);
    setShowModal(true);
  };

  const renderRebuttalContent = (content) => {
    if (!content) return null;

    // Safely extract content
    let pt1 = '';
    let pt2 = '';

    if (typeof content === 'string') {
      pt1 = content;
    } else if (content && typeof content === 'object') {
      pt1 = content.pt1 || '';
      pt2 = content.pt2 || '';
    }

    // Get descriptive titles based on content
    const getInitialTitle = () => {
      if (pt1.toLowerCase().includes('price') || pt1.toLowerCase().includes('cost')) {
        return '💰 Value-Focused Response';
      } else if (pt1.toLowerCase().includes('time') || pt1.toLowerCase().includes('schedule')) {
        return '⏰ Time Management Solution';
      } else if (pt1.toLowerCase().includes('spouse') || pt1.toLowerCase().includes('partner')) {
        return '👥 Spouse/Partner Engagement';
      } else if (pt1.toLowerCase().includes('not ready') || pt1.toLowerCase().includes('later')) {
        return '🎯 Immediate Value Proposition';
      } else if (pt1.toLowerCase().includes('not interested')) {
        return '💡 Interest Building Approach';
      } else {
        return '🎯 Primary Response Strategy';
      }
    };

    const getFollowUpTitle = () => {
      if (pt2.toLowerCase().includes('price') || pt2.toLowerCase().includes('cost')) {
        return '💎 Enhanced Value Offer';
      } else if (pt2.toLowerCase().includes('time') || pt2.toLowerCase().includes('schedule')) {
        return '⚡ Flexible Scheduling Options';
      } else if (pt2.toLowerCase().includes('spouse') || pt2.toLowerCase().includes('partner')) {
        return '🤝 Joint Decision Support';
      } else if (pt2.toLowerCase().includes('not ready') || pt2.toLowerCase().includes('later')) {
        return '✨ Urgency Creation';
      } else if (pt2.toLowerCase().includes('not interested')) {
        return '🌟 Interest Reinforcement';
      } else {
        return '🔄 Advanced Response Strategy';
      }
    };
    
    return (
      <div className="rebuttal-content-sections">
        {pt1 && (
          <div className="rebuttal-section">
            <h4 className="rebuttal-section-title">{getInitialTitle()}</h4>
            <p className="modal-content-text">
              {pt1}
            </p>
          </div>
        )}
        
        <div className="rebuttal-section">
          <h4 className="rebuttal-section-title">{getFollowUpTitle()}</h4>
          <p className="modal-content-text">
            {pt2 || 'No follow-up response available.'}
          </p>
        </div>
      </div>
    );
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const foundCategory = categories.find(cat => cat.id === category);
    return foundCategory ? foundCategory.icon : '📋';
  };

  // Add function to calculate category statistics
  const calculateCategoryStats = useCallback((rebuttals) => {
    const stats = {};
    
    // Initialize stats for all categories
    categories.forEach(cat => {
      if (cat.id !== 'all') {
        stats[cat.id] = {
          count: 0,
          totalViews: 0,
          lastUpdated: null,
          tags: new Set(),
          commonKeywords: new Map()
        };
      }
    });

    // Calculate stats for each rebuttal
    rebuttals.forEach(rebuttal => {
      const categoryId = rebuttal.category;
      if (categoryId && stats[categoryId]) {
        // Increment count
        stats[categoryId].count++;

        // Add tags
        if (rebuttal.tags && Array.isArray(rebuttal.tags)) {
          rebuttal.tags.forEach(tag => stats[categoryId].tags.add(tag));
        }

        // Track last updated
        if (rebuttal.updatedAt) {
          const updatedDate = new Date(rebuttal.updatedAt);
          if (!stats[categoryId].lastUpdated || updatedDate > new Date(stats[categoryId].lastUpdated)) {
            stats[categoryId].lastUpdated = rebuttal.updatedAt;
          }
        }

        // Track common keywords
        const text = `${rebuttal.title} ${rebuttal.summary || ''} ${rebuttal.content?.pt1 || ''} ${rebuttal.content?.pt2 || ''}`;
        const words = text.toLowerCase().split(/\W+/);
        words.forEach(word => {
          if (word.length > 3) { // Only track words longer than 3 characters
            stats[categoryId].commonKeywords.set(
              word,
              (stats[categoryId].commonKeywords.get(word) || 0) + 1
            );
          }
        });
      }
    });

    // Convert Sets and Maps to arrays/objects for state
    Object.keys(stats).forEach(category => {
      stats[category].tags = Array.from(stats[category].tags);
      stats[category].commonKeywords = Array.from(stats[category].commonKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
    });

    return stats;
  }, [categories]);

  // Update stats when rebuttals or categories change
  useEffect(() => {
    if (allRebuttals.length > 0 && categories.length > 0) {
      const stats = calculateCategoryStats(allRebuttals);
      setCategoryStats(stats);
    }
  }, [allRebuttals, categories, calculateCategoryStats]);

  // Add Category Insights component
  const CategoryInsights = ({ category }) => {
    if (category === 'all' || !categoryStats[category]) return null;

    const stats = categoryStats[category];
    const categoryInfo = categories.find(c => c.id === category);

    return (
      <div className="category-insights">
        <div className="insights-header">
          <span className="category-icon">{categoryInfo?.icon || '📊'}</span>
          <h3>{categoryInfo?.name || category} Insights</h3>
        </div>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📚</div>
            <div className="insight-value">{stats.count}</div>
            <div className="insight-label">Total Rebuttals</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🏷️</div>
            <div className="insight-value">{stats.tags.length}</div>
            <div className="insight-label">Unique Tags</div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🔄</div>
            <div className="insight-value">
              {stats.lastUpdated ? new Date(stats.lastUpdated.seconds * 1000).toLocaleDateString() : 'N/A'}
            </div>
            <div className="insight-label">Last Updated</div>
          </div>
        </div>
        {stats.tags.length > 0 && (
          <div className="insights-tags">
            <h4>Common Tags</h4>
            <div className="tag-cloud">
              {stats.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
        {stats.commonKeywords.length > 0 && (
          <div className="insights-keywords">
            <h4>Common Keywords</h4>
            <div className="keyword-list">
              {stats.commonKeywords.map(({ word, count }) => (
                <div key={word} className="keyword-item">
                  <span className="keyword">{word}</span>
                  <span className="count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="library-container">
      <Header 
        title="Rebuttal Library"
        subtitle="Access and manage your collection of rebuttals"
      />
      <div className="library-content">
        {loading ? (
          <div className="library-loading">
            <div className="loading-spinner"></div>
            <p>Loading rebuttals...</p>
          </div>
        ) : (
          <>
            <div className="library-header">
              <h1 className="library-title">Call Center Rebuttals</h1>
              <div className="header-navigation">
                <div className="quick-nav">
                  <button
                    onClick={() => {
                      const slug = localStorage.getItem('currentCompanySlug');
                      if (slug) {
                        window.location.href = `/company/${slug}`;
                      } else {
                        onNavigate('home');
                      }
                    }}
                    className="nav-button home-button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Home
                  </button>
                  <button
                    onClick={() => onNavigate('rebuttals')}
                    className={`nav-button ${window.location.pathname.includes('rebuttals') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 9H17M7 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Rebuttals
                  </button>
                  <button
                    onClick={() => onNavigate('disposition')}
                    className={`nav-button ${window.location.pathname.includes('disposition') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 3H15V5H9V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Lead Disposition
                  </button>
                  <button
                    onClick={() => onNavigate('customerService')}
                    className={`nav-button ${window.location.pathname.includes('customerService') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Customer Service
                  </button>
                  <button
                    onClick={() => onNavigate('faq')}
                    className={`nav-button ${window.location.pathname.includes('faq') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.30197 14.92 10.02C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    FAQ
                  </button>
                  <button
                    onClick={() => onNavigate('scheduleScript')}
                    className={`nav-button ${window.location.pathname.includes('scheduleScript') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Schedule Script
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="search-container">
              <SearchBar
                value={searchTerm}
                onChange={handleSearchChange}
                onClear={() => { setSearchTerm(''); setShowSuggestions(false); setSearchSuggestions([]); }}
                placeholder="Search rebuttals..."
                onKeyDown={handleKeyDown}
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions-dropdown">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.id}
                      className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-icon">
                        {suggestion.icon || '💬'}
                      </span>
                      <div className="suggestion-content">
                        <h4>{suggestion.title}</h4>
                        <p>{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && (
                <div className="search-results-count">
                  {filteredRebuttals.length} result{filteredRebuttals.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            <div className="library-layout">
              {/* Sidebar */}
              <div className="library-sidebar">
                <h2 className="library-sidebar-title">Categories</h2>
                <div className="library-categories">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                      }}
                      className={`library-category-button ${selectedCategory === category.id ? 'active' : ''} ${category.color}`}
                    >
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="library-main">
                {selectedCategory !== 'all' && (
                  <CategoryInsights category={selectedCategory} />
                )}
                {/* Common Objections Header */}
                {searchTerm.toLowerCase() === 'common objections' && (
                  <div className="common-objections-header">
                    <h2 className="common-objections-title">Most Common Objections & Smart Tips</h2>
                    <div className="smart-tips-container">
                      <div className="smart-tip">
                        <span className="tip-icon">💡</span>
                        <strong>Pro Tip:</strong> Always acknowledge the customer's concern before presenting your rebuttal
                      </div>
                      <div className="smart-tip">
                        <span className="tip-icon">🎯</span>
                        <strong>Script Strategy:</strong> Use Part 1 first, then escalate to Part 2 if needed
                      </div>
                      <div className="smart-tip">
                        <span className="tip-icon">⚡</span>
                        <strong>Quick Response:</strong> These 5 objections cover 80% of customer concerns
                      </div>
                    </div>
                  </div>
                )}
                
                {filteredRebuttals.length === 0 ? (
                  <div className="no-rebuttals-message">
                    <p>No rebuttals found in this category.</p>
                    <p className="debug-info">Selected Category: {selectedCategory}</p>
                    <p className="debug-info">Total Rebuttals: {allRebuttals.length}</p>
                    <p className="debug-info">Available Categories: {allRebuttals.map(r => r.category).filter((c, i, a) => a.indexOf(c) === i).join(', ')}</p>
                  </div>
                ) : (
                  filteredRebuttals.map(rebuttal => (
                    <div 
                      key={rebuttal.id} 
                      className="library-rebuttal-card"
                      onClick={() => openModal(rebuttal)}
                    >
                      <div className="library-rebuttal-content">
                        <div className="library-rebuttal-info">
                          <h3 className="library-rebuttal-title">{rebuttal.title}</h3>
                          <p className="library-rebuttal-summary">{rebuttal.summary}</p>
                          <div className="library-rebuttal-tags">
                            {rebuttal.tags.map(tag => (
                              <span key={tag} className="library-rebuttal-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRebuttal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2 className="modal-title">{selectedRebuttal.title}</h2>
              </div>
              <button onClick={closeModal} className="modal-close-button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Tags */}
              <div className="modal-tags">
                {selectedRebuttal.tags && selectedRebuttal.tags.map(tag => (
                  <span key={tag} className="modal-tag">#{tag}</span>
                ))}
              </div>
              {/* Main Situation/Summary */}
              <div className="modal-summary">
                <p className="modal-summary-text">{selectedRebuttal.situationOverview || selectedRebuttal.summary || selectedRebuttal.objection || 'No situation overview available.'}</p>
              </div>
              {/* Main Rebuttal Content: Part 1, Part 2, etc. */}
              <div className="modal-rebuttal-content">
                {renderRebuttalContent(selectedRebuttal.content || selectedRebuttal.response)}
              </div>
              {/* Tips Grid */}
              <div className="modal-tips">
                <div className="modal-section-header">
                  <h3>Pro Tips & Best Practices</h3>
                </div>
                <div className="tips-grid">
                  {(selectedRebuttal.tips && selectedRebuttal.tips.length > 0 ? selectedRebuttal.tips : DEFAULT_TIPS).map((tip, index) => (
                    <div key={index} className="tip-card">
                      <div className="tip-card-header">
                        <span className="tip-icon">{['🎯','💡','⚡','✨','🌟'][index] || '💡'}</span>
                        <span className="tip-number">Tip {index + 1}</span>
                      </div>
                      <div className="tip-content">
                        <p className="tip-text">{tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(!selectedRebuttal.tips || selectedRebuttal.tips.length === 0) && (
                  <div className="default-tips-note">
                    <span className="default-tips-icon">ℹ️</span>
                    <div className="default-tips-content">
                      <p className="default-tips-title">General Best Practices</p>
                      <p className="default-tips-text">These are general best practice tips. Consider adding specific tips for this rebuttal.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-note">
                💡 Pro Tip: Start with the Initial Response. If customer still objects, use the Follow-up Response
              </div>
              <button onClick={closeModal} className="modal-close-footer-button">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add new styles for category insights
const styles = `
.category-insights {
  background: #0f172a; /* dark slate */
  color: #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  border: 1px solid rgba(148,163,184,0.15);
}

.insights-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.insights-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #e5e7eb;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.insight-card {
  background: rgba(30,41,59,0.6);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  border: 1px solid rgba(148,163,184,0.12);
}

.insight-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.insight-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #93c5fd;
  margin-bottom: 4px;
}

.insight-label {
  font-size: 0.9rem;
  color: #a1a1aa;
}

.insights-tags, .insights-keywords {
  margin-top: 24px;
  background: rgba(30,41,59,0.5);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(148,163,184,0.12);
}

.insights-tags h4, .insights-keywords h4 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #e5e7eb;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.insights-tags h4::before {
  content: '🏷️';
}

.insights-keywords h4::before {
  content: '🔍';
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  background: rgba(59,130,246,0.15);
  color: #93c5fd;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid rgba(59,130,246,0.3);
}

.tag:hover {
  background: rgba(59,130,246,0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

.keyword-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.keyword-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(2,6,23,0.8);
  border-radius: 8px;
  border: 1px solid rgba(148,163,184,0.15);
  transition: all 0.2s ease;
}

.keyword-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.keyword {
  font-weight: 500;
  color: #e5e7eb;
  font-size: 0.95rem;
}

.count {
  background: rgba(59,130,246,0.15);
  color: #93c5fd;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 32px;
  text-align: center;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(2,6,23,0.6);
  border-radius: 8px;
  border: 1px solid rgba(148,163,184,0.15);
}

.modal-tag {
  background: rgba(59,130,246,0.15);
  color: #93c5fd;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid rgba(59,130,246,0.3);
  transition: all 0.2s ease;
}

.modal-tag:hover {
  background: rgba(59,130,246,0.25);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

.modal-summary {
  background: #0b1324;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(148,163,184,0.15);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
}

.modal-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e3f2fd;
}

.modal-section-header svg {
  color: #1976d2;
}

.modal-section-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #e5e7eb;
  font-weight: 600;
}

.modal-summary-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #e5e7eb;
  margin: 0;
  padding: 0 4px;
}

.modal-rebuttal-content {
  background: #0b1324;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(148,163,184,0.15);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
}

.rebuttal-content-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rebuttal-section {
  background: rgba(2,6,23,0.6);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(148,163,184,0.15);
}

.rebuttal-section-title {
  color: #93c5fd;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-content-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.modal-tips {
  background: #0b1324;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(148,163,184,0.15);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.tip-card {
  background: rgba(2,6,23,0.6);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(148,163,184,0.15);
  transition: all 0.2s ease;
  color: #e5e7eb;
}

.tip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.tip-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #e5e7eb;
}

.tip-icon { color: #93c5fd; }

.tip-icon-wrapper {
  background: rgba(59,130,246,0.15);
  color: #93c5fd;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 1px solid rgba(59,130,246,0.3);
}

.tip-number {
  font-weight: 600;
  color: #e5e7eb;
}

.tip-text {
  margin: 0;
  color: #e5e7eb;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid rgba(148,163,184,0.15);
  margin-top: 24px;
}

.modal-footer-note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a1a1aa;
  font-size: 0.9rem;
}

.modal-close-footer-button {
  background: #1f3b73;
  color: #e5e7eb;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-footer-button:hover {
  background: #2450a4;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

/* Dark mode for situations section */
.modal-situations {
  background: #0b1324;
  color: #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(148,163,184,0.15);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
}

.situation-item {
  background: rgba(2,6,23,0.6);
  border: 1px solid rgba(148,163,184,0.15);
  border-radius: 8px;
  padding: 12px;
}

.situation-title { color: #93c5fd; }
.situation-description { color: #e5e7eb; }
`;

// Add styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default RebuttalLibrary;