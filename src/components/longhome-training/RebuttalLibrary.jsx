import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './RebuttalLibrary.css';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getDb } from '../../services/firebase/config';
import rebuttalsService from '../../services/rebuttalsService';


const RebuttalLibrary = ({ onNavigate, searchQuery }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [selectedRebuttal, setSelectedRebuttal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [allRebuttals, setAllRebuttals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [displayedCount, setDisplayedCount] = useState(30); // Start with 30 items for performance

  // Handle navigation
  const handleNavigate = (route) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      const routes = {
        'home': '/app',
        'rebuttals': '/rebuttals',
        'disposition': '/disposition',
        'customerService': '/customerService',
        'faq': '/faq',
        'scheduleScript': '/scheduleScript'
      };
      const path = routes[route] || '/app';
      navigate(path);
    }
  };

  // Normalize content to { pt1, pt2 }
  const normalizeContent = useCallback((rebuttal) => {
    if (!rebuttal) return null;

    const pick = (obj, keys) => {
      if (!obj) return '';
      for (const k of keys) {
        if (obj[k]) return obj[k];
      }
      return '';
    };

    const c = rebuttal.content && typeof rebuttal.content === 'object' ? rebuttal.content : {};
    const r = rebuttal.response && typeof rebuttal.response === 'object' ? rebuttal.response : {};

    const pt1 = typeof rebuttal.content === 'string'
      ? rebuttal.content
      : pick(c, ['pt1', 'initial', 'part1', 'content1', 'first', 'opening'])
        || pick(r, ['pt1', 'initial', 'part1', 'content1', 'first', 'opening'])
        || rebuttal.summary || rebuttal.objection || '';

    const pt2 = pick(c, ['pt2', 'followup', 'followUp', 'part2', 'content2', 'second', 'closing'])
      || pick(r, ['pt2', 'followup', 'followUp', 'part2', 'content2', 'second', 'closing'])
      || '';

    return { ...rebuttal, content: { pt1, pt2 } };
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const dbCategories = await rebuttalsService.getCategories();
        const formattedCategories = [
          { id: 'all', name: 'All Categories', icon: '📋', color: '#6b7280' },
          ...dbCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '📋',
            color: '#3b82f6'
          }))
        ];
        setCategories(formattedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch rebuttals with real-time listener
  useEffect(() => {
    const rebuttalsQuery = query(
      collection(getDb(), 'rebuttals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(rebuttalsQuery, (snapshot) => {
      const updatedRebuttals = snapshot.docs.map(doc => normalizeContent({
        id: doc.id,
        ...doc.data()
      }));
      setAllRebuttals(updatedRebuttals);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to rebuttals:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [normalizeContent]);

  // Filter rebuttals with memoization
  const filteredRebuttals = useMemo(() => {
    let filtered = allRebuttals;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rebuttal => {
        // Handle both category ID and category name matching
        const rebuttalCategory = rebuttal.category;
        if (!rebuttalCategory) return false;
        
        // Direct ID match
        if (rebuttalCategory === selectedCategory) return true;
        
        // Try to match by category name (if category is stored as name instead of ID)
        const categoryInfo = categories.find(c => c.id === selectedCategory);
        if (categoryInfo && rebuttalCategory === categoryInfo.name) return true;
        
        // Try case-insensitive matching
        if (typeof rebuttalCategory === 'string' && typeof selectedCategory === 'string') {
          if (rebuttalCategory.toLowerCase() === selectedCategory.toLowerCase()) return true;
          if (categoryInfo && rebuttalCategory.toLowerCase() === categoryInfo.name.toLowerCase()) return true;
        }
        
        return false;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(rebuttal => {
        const titleMatch = rebuttal.title?.toLowerCase().includes(searchLower);
        const summaryMatch = rebuttal.summary?.toLowerCase().includes(searchLower);
        const tagsMatch = rebuttal.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        const contentMatch = rebuttal.content?.pt1?.toLowerCase().includes(searchLower) ||
                            rebuttal.content?.pt2?.toLowerCase().includes(searchLower);
        return titleMatch || summaryMatch || tagsMatch || contentMatch;
      });
    }

    return filtered;
  }, [allRebuttals, selectedCategory, searchTerm, categories]);

  // Get display text for card summary
  const getCardSummary = useCallback((rebuttal) => {
    // Try multiple fields in order of preference
    let summary = '';
    if (rebuttal.summary && rebuttal.summary.trim()) {
      summary = rebuttal.summary.trim();
    } else if (rebuttal.situationOverview && rebuttal.situationOverview.trim()) {
      summary = rebuttal.situationOverview.trim();
    } else if (rebuttal.description && rebuttal.description.trim()) {
      summary = rebuttal.description.trim();
    } else if (rebuttal.objection && rebuttal.objection.trim()) {
      summary = rebuttal.objection.trim();
    } else if (rebuttal.content?.pt1) {
      const text = typeof rebuttal.content.pt1 === 'string' ? rebuttal.content.pt1.trim() : '';
      if (text) {
        summary = text.length > 150 ? text.substring(0, 150) + '...' : text;
      }
    }
    
    // Clean up the summary - remove excessive whitespace
    summary = summary.replace(/\s+/g, ' ').trim();
    
    return summary || 'Click to view details';
  }, []);

  // Paginated rebuttals for performance
  const displayedRebuttals = useMemo(() => {
    return filteredRebuttals.slice(0, displayedCount);
  }, [filteredRebuttals, displayedCount]);

  // Load more function
  const loadMore = useCallback(() => {
    setDisplayedCount(prev => prev + 30);
  }, []);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(30);
  }, [selectedCategory, searchTerm]);

  // Modal handlers
  const openModal = (rebuttal) => {
    setSelectedRebuttal(rebuttal);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRebuttal(null);
    document.body.style.overflow = '';
  };

  // Render rebuttal content
  const renderRebuttalContent = (content) => {
    if (!content) return null;

    const pt1 = content.pt1 || '';
    const pt2 = content.pt2 || '';

    return (
      <div className="rebuttal-content-sections">
        {pt1 && (
          <div className="rebuttal-section">
            <h4 className="rebuttal-section-title">🎯 Initial Response</h4>
            <p className="modal-content-text">{pt1}</p>
          </div>
        )}
        {pt2 && (
          <div className="rebuttal-section">
            <h4 className="rebuttal-section-title">🔄 Follow-up Response</h4>
            <p className="modal-content-text">{pt2}</p>
          </div>
        )}
        {!pt1 && !pt2 && (
          <p className="modal-content-text">No content available.</p>
        )}
      </div>
    );
  };

  // Get category counts
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return allRebuttals.length;
    
    const categoryInfo = categories.find(c => c.id === categoryId);
    return allRebuttals.filter(r => {
      if (!r.category) return false;
      // Match by ID
      if (r.category === categoryId) return true;
      // Match by category name
      if (categoryInfo && r.category === categoryInfo.name) return true;
      // Case-insensitive match
      if (typeof r.category === 'string' && typeof categoryId === 'string') {
        if (r.category.toLowerCase() === categoryId.toLowerCase()) return true;
        if (categoryInfo && r.category.toLowerCase() === categoryInfo.name.toLowerCase()) return true;
      }
      return false;
    }).length;
  };


  if (loading) {
    return (
      <div className="rebuttal-library-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading rebuttals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rebuttal-library-page">
      {/* Header */}
      <div className="library-page-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="page-title">Rebuttal Library</h1>
            <p className="page-subtitle">Access and manage your collection of rebuttals</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <div className="search-input-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search rebuttals by title, summary, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-button"
                onClick={() => setSearchTerm('')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="search-results-count">
              {filteredRebuttals.length} result{filteredRebuttals.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="library-main-content">
        {/* Sidebar - Categories */}
        <aside className="library-sidebar">
          <h2 className="sidebar-title">Categories</h2>
          <div className="categories-list">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">({getCategoryCount(category.id)})</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Rebuttals Grid */}
        <main className="library-content-area">
          {filteredRebuttals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No rebuttals found</h3>
              <p>
                {searchTerm
                  ? `No rebuttals match your search "${searchTerm}". Try a different search term.`
                  : selectedCategory !== 'all'
                  ? `No rebuttals found in this category.`
                  : 'No rebuttals available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="rebuttals-grid">
                {displayedRebuttals.map(rebuttal => (
                <div
                  key={rebuttal.id}
                  className="rebuttal-card"
                  onClick={() => openModal(rebuttal)}
                >
                  <div className="card-header">
                    <h3 className="card-title">{rebuttal.title || 'Untitled Rebuttal'}</h3>
                  </div>
                  <p className="card-summary">{getCardSummary(rebuttal)}</p>
                  {rebuttal.tags && Array.isArray(rebuttal.tags) && rebuttal.tags.length > 0 && (
                    <div className="card-tags">
                      {rebuttal.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                      {rebuttal.tags.length > 3 && (
                        <span className="tag-more">+{rebuttal.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                  <div className="card-footer">
                    <span className="view-button">View Details →</span>
                  </div>
                </div>
              ))}
              </div>
              {filteredRebuttals.length > displayedCount && (
                <div className="load-more-container">
                  <button className="load-more-button" onClick={loadMore}>
                    Load More ({filteredRebuttals.length - displayedCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* New Modal - Independent styling, doesn't follow home rules */}
      {showModal && selectedRebuttal && createPortal(
        <div className="rebuttal-modal-overlay" onClick={closeModal}>
          <div className="rebuttal-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rebuttal-modal-header">
              <h2 className="rebuttal-modal-title">{selectedRebuttal.title}</h2>
              <button className="rebuttal-modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="rebuttal-modal-body">
              {/* Tags */}
              {selectedRebuttal.tags && Array.isArray(selectedRebuttal.tags) && selectedRebuttal.tags.length > 0 && (
                <div className="rebuttal-modal-tags">
                  {selectedRebuttal.tags.map(tag => (
                    <span key={tag} className="rebuttal-modal-tag">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="rebuttal-modal-summary">
                <h4 className="rebuttal-summary-title">Situation Overview</h4>
                <p className="rebuttal-summary-text">
                  {selectedRebuttal.situationOverview || selectedRebuttal.summary || selectedRebuttal.objection || 'No situation overview available.'}
                </p>
              </div>

              {/* Content */}
              <div className="rebuttal-modal-content-section">
                {renderRebuttalContent(selectedRebuttal.content || selectedRebuttal.response)}
              </div>
            </div>

            <div className="rebuttal-modal-footer">
              <button className="rebuttal-close-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RebuttalLibrary;
