import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs } from 'firebase/firestore';
import { getDb } from '../../services/firebase/config';
import { getServiceTopics, getServiceTopicsByCategory, getUrgentServiceTopics, getCategories } from '../../services/customerServiceService';
import './CustomerService.css';

// Fuzzy search helper function
const fuzzySearch = (str, pattern) => {
  pattern = pattern.toLowerCase();
  str = str.toLowerCase();
  let patternIdx = 0;
  let strIdx = 0;
  let matches = 0;
  let lastMatch = -1;

  while (strIdx < str.length && patternIdx < pattern.length) {
    if (pattern[patternIdx] === str[strIdx]) {
      matches++;
      lastMatch = strIdx;
      patternIdx++;
    }
    strIdx++;
  }

  return patternIdx === pattern.length ? matches / pattern.length : 0;
};

// Enhanced common misspellings mapping
const commonMisspellings = {
  'appointment': ['apointment', 'appoinment', 'appoitment', 'apointmnt'],
  'schedule': ['scedule', 'scedual', 'schedual', 'scedul'],
  'cancel': ['cancell', 'cancle', 'cancell', 'cancle'],
  'reschedule': ['rescedule', 'rescedual', 'reschedual', 'rescedul'],
  'confirm': ['confrim', 'conferm', 'confurm', 'confrm'],
  'follow': ['follw', 'folow', 'foll', 'folow'],
  'up': ['up', 'up', 'up', 'up'],
  'management': ['managment', 'mangement', 'managment', 'mangmnt'],
  'service': ['servise', 'servis', 'servic', 'servis'],
  'customer': ['custumer', 'custmer', 'custmor', 'custmr'],
  'help': ['helpp', 'helpe', 'hel', 'helpe'],
  'search': ['searcgh', 'serch', 'searh', 'serach'],
  'find': ['fid', 'findd', 'fnd', 'find'],
  'looking': ['lookin', 'lookng', 'lookig', 'lookn'],
  'assist': ['asist', 'assistt', 'asst', 'asist'],
  'home': ['hom', 'hoem', 'hme', 'hom'],
  'correct': ['corrcet', 'corret', 'corrct', 'corret'],
  'spell': ['spel', 'spelll', 'spl', 'spel'],
  'word': ['wrd', 'wor', 'wod', 'wrd'],
  'make': ['mak', 'maek', 'mke', 'mak'],
  'way': ['wai', 'wae', 'wayy', 'wai'],
  'more': ['moer', 'mor', 'mre', 'moer'],
  'helpful': ['helpfull', 'helpfu', 'helful', 'helpfl'],
  'something': ['somehting', 'somthing', 'somethng', 'somethig'],
  'wrong': ['wron', 'wrog', 'wong', 'wronng'],
  'will': ['wil', 'wll', 'wil', 'wll'],
  'try': ['try', 'tri', 'tryy', 'try'],
  'auto': ['auto', 'aut', 'autoo', 'auto'],
  'options': ['aoptiinoin', 'optins', 'optons', 'opions'],
  'bar': ['bar', 'br', 'bar', 'br']
};

// Common search patterns
const searchPatterns = {
  'how to': ['how do i', 'how can i', 'how do you', 'how to'],
  'when can': ['when can i', 'when is', 'when will', 'when should'],
  'where to': ['where can i', 'where do i', 'where is', 'where to'],
  'what is': ['whats', 'what is', 'what are', 'what do'],
  'why do': ['why does', 'why is', 'why are', 'why do'],
  'can i': ['can you', 'is it possible', 'is there a way', 'can i'],
  'need to': ['want to', 'have to', 'should i', 'need to'],
  'looking for': ['searching for', 'trying to find', 'want to find', 'looking for']
};

const CustomerService = ({ onNavigate, searchQuery }) => {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [urgentRebuttal, setUrgentRebuttal] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceTopics, setServiceTopics] = useState([]);
  const [urgentTopics, setUrgentTopics] = useState([]);

  const topics = [
    { 
      id: 'appointments', 
      name: 'Appointment Management', 
      icon: '📅', 
      color: 'blue',
      features: [
        'Calendar Integration',
        'Automated Reminders',
        'Conflict Resolution',
        'Appointment History',
        'Rescheduling Options'
      ],
      description: 'Manage your appointments efficiently with our comprehensive scheduling system'
    },
    { 
      id: 'scheduling', 
      name: 'Scheduling', 
      icon: '⏰', 
      color: 'green',
      features: [
        'Real-time Availability',
        'Multiple Time Zones',
        'Recurring Appointments',
        'Buffer Time Settings'
      ],
      description: 'Schedule appointments with ease using our flexible booking system'
    },
    { 
      id: 'confirmation', 
      name: 'Confirmation', 
      icon: '✅', 
      color: 'yellow',
      features: [
        'Email Confirmations',
        'SMS Notifications',
        'Calendar Invites',
        'Reminder Settings'
      ],
      description: 'Keep track of your appointments with automated confirmations'
    },
    { 
      id: 'cancellation', 
      name: 'Cancellation', 
      icon: '❌', 
      color: 'red',
      features: [
        'Cancellation Policy',
        'Rescheduling Options',
        'Waitlist Management',
        'No-show Prevention'
      ],
      description: 'Handle appointment cancellations and rescheduling efficiently'
    },
    { 
      id: 'followup', 
      name: 'Follow-up', 
      icon: '📞', 
      color: 'purple',
      features: [
        'Post-appointment Surveys',
        'Feedback Collection',
        'Follow-up Scheduling',
        'Communication History'
      ],
      description: 'Maintain relationships with automated follow-up systems'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading customer service data...');

      // Load categories
      const categoriesData = await getCategories();
      console.log('Loaded categories:', categoriesData);
      setCategories(categoriesData);

      // Load service topics
      const topicsData = await getServiceTopics();
      console.log('Loaded service topics:', topicsData);
      setServiceTopics(topicsData);

      // Load urgent topics
      const urgentData = await getUrgentServiceTopics();
      console.log('Loaded urgent topics:', urgentData);
      setUrgentTopics(urgentData);

      // Debug log for all topics
      console.log('All topics combined:', [...topicsData, ...urgentData]);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allServiceTopics = [...serviceTopics, ...urgentTopics].map((topic, index) => ({
    ...topic,
    uniqueId: `${topic.id}-${index}`
  }));

  const correctSpelling = (word) => {
    const lowerWord = word.toLowerCase();
    for (const [correct, misspellings] of Object.entries(commonMisspellings)) {
      if (misspellings.includes(lowerWord)) {
        return correct;
      }
    }
    return word;
  };

  const normalizeSearchQuery = (query) => {
    let normalized = query.toLowerCase();
    
    // Replace common patterns
    for (const [pattern, variations] of Object.entries(searchPatterns)) {
      for (const variation of variations) {
        if (normalized.includes(variation)) {
          normalized = normalized.replace(variation, pattern);
        }
      }
    }

    // Correct spelling
    return normalized.split(' ').map(word => correctSpelling(word)).join(' ');
  };

  const getSearchSuggestions = (term) => {
    if (!term.trim()) {
      return [];
    }

    const normalizedTerm = normalizeSearchQuery(term);
    const suggestions = [];

    // Search through all service topics
    allServiceTopics.forEach(topic => {
      const titleScore = fuzzySearch(topic.title, normalizedTerm);
      const descScore = fuzzySearch(topic.description, normalizedTerm);
      const keywordScores = topic.keywords.map(keyword => fuzzySearch(keyword, normalizedTerm));
      const maxKeywordScore = Math.max(...keywordScores);

      const relevanceScore = Math.max(titleScore, descScore, maxKeywordScore);

      if (relevanceScore > 0.3) {
        suggestions.push({
          ...topic,
          relevanceScore
        });
      }
    });

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // Perform search immediately
    const suggestions = getSearchSuggestions(value);
    setSearchSuggestions(suggestions);
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
    setSelectedService(suggestion);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const filteredTopics = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return allServiceTopics.filter(topic => {
      const matchesCategory = selectedTopic === 'all' || topic.topic === selectedTopic;
      
      // If there's no search term, only filter by category
      if (!searchTermLower) {
        return matchesCategory;
      }
      
      // Search in title, description, steps, tips, and keywords
      const matchesSearch = 
        topic.title?.toLowerCase().includes(searchTermLower) ||
        topic.description?.toLowerCase().includes(searchTermLower) ||
        topic.steps?.some(step => step.toLowerCase().includes(searchTermLower)) ||
        topic.tips?.some(tip => tip.toLowerCase().includes(searchTermLower)) ||
        topic.keywords?.some(keyword => keyword.toLowerCase().includes(searchTermLower));
      
      return matchesCategory && matchesSearch;
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [allServiceTopics, selectedTopic, searchTerm]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedService(null);
    document.body.style.overflow = '';
  };

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    setSearchTerm('');
    setUrgentRebuttal(action);
    setShowModal(true);
  };



  if (loading) {
    return (
      <div className="customer-service-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading customer service data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-service-page">
        <div className="error-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
          <button className="retry-button" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-service-page">
      {/* Header */}
      <div className="customer-service-page-header">
        <div className="header-top">
          <div className="header-left">
            <h1 className="page-title">Customer Service</h1>
            <p className="page-subtitle">Manage customer service interactions and support</p>
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
              placeholder="Search service topics..."
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
                  key={suggestion.uniqueId}
                  className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-icon">
                    {topics.find(t => t.id === suggestion.topic)?.icon || '📋'}
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
              {filteredTopics.length} result{filteredTopics.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="customer-service-main-content">
        {/* Sidebar - Topics */}
        <aside className="customer-service-sidebar">
          <h2 className="sidebar-title">Service Topics</h2>
          <div className="topic-buttons">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`topic-button ${selectedTopic === 'all' ? 'active' : ''}`}
            >
              <span className="topic-icon">📋</span>
              <span className="topic-name">All Topics</span>
            </button>
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`topic-button ${selectedTopic === topic.id ? 'active' : ''}`}
              >
                <span className="topic-icon">{topic.icon}</span>
                <span className="topic-name">{topic.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Service Topics Grid */}
        <main className="customer-service-content-area">
          {filteredTopics.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No service topics found</h3>
              <p>
                {searchTerm
                  ? `No topics match your search "${searchTerm}". Try a different search term.`
                  : selectedTopic !== 'all'
                  ? `No topics found in this category.`
                  : 'No service topics available.'}
              </p>
            </div>
          ) : (
            <div className="categories-grid">
              {filteredTopics.map(topic => (
                <div 
                  key={topic.uniqueId} 
                  className="category-card"
                  onClick={() => handleServiceClick(topic)}
                >
                  <div className="category-header">
                    <span className="category-icon">
                      {topics.find(t => t.id === topic.topic)?.icon || '📋'}
                    </span>
                    <h3>{topic.title}</h3>
                  </div>
                  <div className="category-description">
                    <p>{topic.description}</p>
                  </div>
                  
                  <div className="category-details">
                    <div className="key-steps">
                      <h4>Key Steps</h4>
                      <ul>
                        {topic.steps && topic.steps.slice(0, 3).map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="quick-tips">
                      <h4>Quick Tips</h4>
                      <ul>
                        {topic.tips && topic.tips.slice(0, 2).map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {topic.keywords && topic.keywords.length > 0 && (
                    <div className="category-tags">
                      {topic.keywords.map((keyword, index) => (
                        <span key={index} className="category-tag">{keyword}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Service Detail Modal */}
      {showModal && selectedService && createPortal(
        <div className="customer-service-modal-overlay" onClick={closeModal}>
          <div className="customer-service-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="customer-service-modal-header">
              <h2 className="customer-service-modal-title">{selectedService.title}</h2>
              <button className="customer-service-modal-close" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="customer-service-modal-body">
              <div className="customer-service-modal-section">
                <h3 className="customer-service-section-title">Description</h3>
                <p className="customer-service-description-text">{selectedService.description}</p>
              </div>
              
              {selectedService.steps && selectedService.steps.length > 0 && (
                <div className="customer-service-modal-section">
                  <h3 className="customer-service-section-title">Steps</h3>
                  <ol className="customer-service-steps-list">
                    {selectedService.steps.map((step, index) => (
                      <li key={index} className="customer-service-step-item">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {selectedService.tips && selectedService.tips.length > 0 && (
                <div className="customer-service-modal-section">
                  <h3 className="customer-service-section-title">Tips</h3>
                  <ul className="customer-service-tips-list">
                    {selectedService.tips.map((tip, index) => (
                      <li key={index} className="customer-service-tip-item">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedService.keywords && selectedService.keywords.length > 0 && (
                <div className="customer-service-modal-section">
                  <h3 className="customer-service-section-title">Related Keywords</h3>
                  <div className="customer-service-keyword-tags">
                    {selectedService.keywords.map((keyword, index) => (
                      <span key={index} className="customer-service-keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="customer-service-modal-footer">
              <button className="customer-service-close-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomerService;