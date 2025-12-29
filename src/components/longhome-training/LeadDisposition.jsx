import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import leadDispositionService from '../../services/leadDispositionService';
import './LeadDisposition.css';

const DispositionModal = ({ disposition, onClose }) => {
  if (!disposition) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return createPortal(
    <div className="lead-disposition-modal-overlay" onClick={onClose}>
      <div className="lead-disposition-modal-content" onClick={handleModalClick}>
        <div className="lead-disposition-modal-header">
          <div className="lead-disposition-modal-title-wrapper">
            <span className="lead-disposition-modal-icon">{disposition.icon}</span>
            <h2 className="lead-disposition-modal-title">{disposition.name}</h2>
            <span className="lead-disposition-modal-category">{disposition.category}</span>
          </div>
          <button className="lead-disposition-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="lead-disposition-modal-body">
          <div className="lead-disposition-modal-section lead-disposition-description-section">
            <h3 className="lead-disposition-section-title">Description</h3>
            <p className="lead-disposition-expanded-description">{disposition.description}</p>
          </div>

          {disposition.examples && disposition.examples.length > 0 && (
            <div className="lead-disposition-modal-section lead-disposition-examples-section">
              <h3 className="lead-disposition-section-title">Common Examples</h3>
              <div className="lead-disposition-examples-grid">
                {disposition.examples.map((example, index) => (
                  <div key={index} className="lead-disposition-example-card">
                    <div className="lead-disposition-example-header">
                      <span className="lead-disposition-example-icon">📋</span>
                      <span className="lead-disposition-example-number">Example {index + 1}</span>
                    </div>
                    <p className="lead-disposition-example-text">{example}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="lead-disposition-modal-section lead-disposition-next-steps-section">
            <h3 className="lead-disposition-section-title">Next Steps</h3>
            <p className="lead-disposition-next-steps-text">{disposition.nextSteps}</p>
          </div>

          {disposition.tips && disposition.tips.length > 0 && (
            <div className="lead-disposition-modal-section lead-disposition-tips-section">
              <h3 className="lead-disposition-section-title">Tips & Best Practices</h3>
              <ul className="lead-disposition-tips-list">
                {disposition.tips.map((tip, index) => (
                  <li key={index} className="lead-disposition-tip-item">
                    <span className="lead-disposition-tip-icon">💡</span>
                    <span className="lead-disposition-tip-text">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {disposition.subcategories && disposition.subcategories.length > 0 && (
            <div className="lead-disposition-modal-section lead-disposition-subcategories-section">
              <h3 className="lead-disposition-section-title">Subcategories</h3>
              <div className="lead-disposition-subcategories-grid">
                {disposition.subcategories.map((subcategory, index) => (
                  <div key={index} className="lead-disposition-subcategory-card">
                    <span className="lead-disposition-subcategory-icon">🔹</span>
                    <span className="lead-disposition-subcategory-name">{subcategory}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="lead-disposition-modal-footer">
          <button className="lead-disposition-close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LeadDisposition = ({ onNavigate, searchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDisposition, setSelectedDisposition] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [showModal, setShowModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dispositions, setDispositions] = useState([]);
  const [filteredDispositions, setFilteredDispositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispositionCategories, setDispositionCategories] = useState([]);

  // Get category icon
  const getCategoryIcon = useCallback((category) => {
    const foundCategory = dispositionCategories.find(cat => cat.id === category);
    return foundCategory ? foundCategory.icon : '📋';
  }, [dispositionCategories]);

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
    if (!text) return 0;
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
  const performIntelligentSearch = async (query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const searchResults = await leadDispositionService.searchDispositions(query);
      setSearchSuggestions(searchResults);
    } catch (err) {
      console.error('Error searching dispositions:', err);
      setError('Failed to search dispositions. Please try again.');
    }
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
    setSearchTerm(suggestion.name);
    setShowSuggestions(false);
    setSelectedDisposition(suggestion);
    setShowModal(true);
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setSelectedDisposition(action);
    setShowModal(true);
  };

  const handleReinitializeDispositions = async () => {
    try {
      setLoading(true);
      setError(null);
      await leadDispositionService.forceReinitializeDispositions();
      const fetchedDispositions = await leadDispositionService.getAllDispositions();
      setDispositions(fetchedDispositions);
      setFilteredDispositions(fetchedDispositions);
    } catch (err) {
      console.error('Error reinitializing dispositions:', err);
      setError('Failed to reinitialize dispositions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dispositions and categories from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both dispositions and categories
        const [fetchedDispositions, fetchedCategories] = await Promise.all([
          leadDispositionService.getAllDispositions(),
          leadDispositionService.getDispositionCategories()
        ]);
        
        setDispositions(fetchedDispositions);
        setFilteredDispositions(fetchedDispositions);
        setDispositionCategories(fetchedCategories);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update filtered dispositions when category or search changes
  useEffect(() => {
    if (!dispositions) return; // Guard against uninitialized dispositions

    let filtered = dispositions;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower) ||
        d.nextSteps.toLowerCase().includes(searchLower) ||
        (Array.isArray(d.tips) && d.tips.some(tip => tip.toLowerCase().includes(searchLower)))
      );
    }

    setFilteredDispositions(filtered);
  }, [dispositions, searchTerm, selectedCategory]);

  // Reset to all dispositions when component mounts or when returning to the page
  useEffect(() => {
    setSelectedCategory('all');
    setSearchTerm('');
  }, []);

  const handleDispositionClick = (disposition) => {
    setSelectedDisposition(disposition);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDisposition(null);
    document.body.style.overflow = '';
  };

  // Get category counts
  const getCategoryCount = useCallback((categoryId) => {
    if (categoryId === 'all') return filteredDispositions.length;
    return filteredDispositions.filter(d => d.category === categoryId).length;
  }, [filteredDispositions]);

  // Categories list
  const categoriesList = useMemo(() => {
    const allCategories = [{ id: 'all', name: 'All Categories', icon: '📋' }];
    const uniqueCategories = Array.from(new Set(dispositions.map(d => d.category)))
      .filter(Boolean)
      .map(cat => ({
        id: cat,
        name: cat,
        icon: getCategoryIcon(cat)
      }));
    return [...allCategories, ...uniqueCategories];
  }, [dispositions, getCategoryIcon]);

  if (loading) {
    return (
      <div className="lead-disposition-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dispositions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lead-disposition-page">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-disposition-page">
      {/* Header */}
      <div className="lead-disposition-page-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="page-title">Lead Disposition</h1>
            <p className="page-subtitle">Track and manage your lead dispositions</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={handleReinitializeDispositions}
              className="reinitialize-button"
              disabled={loading}
            >
              {loading ? 'Reinitializing...' : 'Reinitialize Dispositions'}
            </button>
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
              placeholder="Search lead dispositions..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            {searchTerm && (
              <button
                className="clear-search-button"
                onClick={() => { setSearchTerm(''); setShowSuggestions(false); setSearchSuggestions([]); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          
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
                    {suggestion.icon || '📋'}
                  </span>
                  <div className="suggestion-content">
                    <h4>{suggestion.name}</h4>
                    <p>{suggestion.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm && (
            <div className="search-results-count">
              {filteredDispositions.length} result{filteredDispositions.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="lead-disposition-main-content">
        {/* Sidebar - Categories */}
        <aside className="lead-disposition-sidebar">
          <h2 className="sidebar-title">Categories</h2>
          <div className="categories-list">
            {categoriesList.map(category => (
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

        {/* Dispositions Grid */}
        <main className="lead-disposition-content-area">
          {filteredDispositions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No dispositions found</h3>
              <p>
                {searchTerm
                  ? `No dispositions match your search "${searchTerm}". Try a different search term.`
                  : selectedCategory !== 'all'
                  ? `No dispositions found in this category.`
                  : 'No dispositions available.'}
              </p>
            </div>
          ) : (
            <div className="dispositions-grid">
              {filteredDispositions.map(disposition => (
                <div 
                  key={disposition.id} 
                  className="disposition-card"
                  onClick={() => handleDispositionClick(disposition)}
                >
                  <div className="card-header">
                    <span className="card-icon">{disposition.icon}</span>
                    <div className="card-title-container">
                      <h2 className="card-title">{disposition.name}</h2>
                      <span className="card-category">{disposition.category}</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <p className="card-description">{disposition.description}</p>
                    <div className="card-preview">
                      <div className="preview-section">
                        <h4>Next Steps</h4>
                        <p>{disposition.nextSteps}</p>
                      </div>
                      {disposition.tips && disposition.tips.length > 0 && (
                        <div className="preview-section">
                          <h4>Key Tips</h4>
                          <ul>
                            {disposition.tips.slice(0, 2).map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                            {disposition.tips.length > 2 && (
                              <li className="more-tips">+{disposition.tips.length - 2} more tips</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <span className="click-hint">Click to view full details</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && selectedDisposition && (
        <DispositionModal 
          disposition={selectedDisposition} 
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default LeadDisposition;