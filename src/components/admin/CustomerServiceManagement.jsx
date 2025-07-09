import React, { useState, useEffect } from 'react';
import { getServiceTopics, addServiceTopic, updateServiceTopic, deleteServiceTopic, resetServiceTopics } from '../../services/customerServiceService';
import './CustomerServiceManagement.css';

const EMOJI_ICONS = {
  'Appointment Management': '📅',
  'Scheduling': '⏰',
  'Cancellation': '❌',
  'Confirmation': '✅',
  'Follow-up': '📞',
  'Rescheduling': '🔄',
  'Urgent': '⚠️',
  'General': '💬'
};

const CATEGORIES = [
  'appointments',
  'scheduling',
  'confirmation',
  'cancellation',
  'followup'
];

const CustomerServiceManagement = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    categories: {}
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topic: '',
    category: '',
    icon: '',
    steps: [''],
    tips: [''],
    keywords: [''],
    isUrgent: false
  });

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    // Calculate stats
    const urgentCount = topics.filter(t => t.isUrgent).length;
    const categoryCounts = {};
    topics.forEach(topic => {
      categoryCounts[topic.category] = (categoryCounts[topic.category] || 0) + 1;
    });
    
    setStats({
      total: topics.length,
      urgent: urgentCount,
      categories: categoryCounts
    });
  }, [topics]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await getServiceTopics();
      setTopics(data);
      setError(null);
    } catch (err) {
      setError('Failed to load service topics. Please try again.');
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all service topics? This action cannot be undone.')) {
      try {
        setLoading(true);
        await resetServiceTopics();
        await loadTopics();
        setError('Service topics have been reset successfully!');
        setTimeout(() => setError(null), 3000);
      } catch (err) {
        setError('Failed to reset service topics. Please try again.');
        console.error('Error resetting topics:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddTopic = () => {
    setFormData({
      title: '',
      description: '',
      topic: '',
      category: '',
      icon: '',
      steps: [''],
      tips: [''],
      keywords: [''],
      isUrgent: false
    });
    setShowAddModal(true);
  };

  const handleEditTopic = (topic) => {
    setSelectedTopic(topic);
    setFormData({
      title: topic.title,
      description: topic.description,
      topic: topic.topic,
      category: topic.category,
      icon: topic.icon,
      steps: topic.steps || [''],
      tips: topic.tips || [''],
      keywords: topic.keywords || [''],
      isUrgent: topic.isUrgent || false
    });
    setShowEditModal(true);
  };

  const handleDeleteTopic = (topic) => {
    setSelectedTopic(topic);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showAddModal) {
        await addServiceTopic(formData);
      } else {
        await updateServiceTopic(selectedTopic.id, formData);
      }
      await loadTopics();
      setShowAddModal(false);
      setShowEditModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to save service topic. Please try again.');
      console.error('Error saving topic:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteServiceTopic(selectedTopic.id);
      await loadTopics();
      setShowDeleteModal(false);
      setError(null);
    } catch (err) {
      setError('Failed to delete service topic. Please try again.');
      console.error('Error deleting topic:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon }));
    setShowIconPicker(false);
  };

  const filteredAndSortedTopics = topics
    .filter(topic => {
      const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          topic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          topic.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'urgent':
          return (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0);
        default:
          return 0;
      }
    });

  const categories = [...new Set(topics.map(t => t.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="customer-service-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading customer service topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-service-management">
      {/* Header Section */}
      <div className="management-header">
        <div className="header-content">
          <h2>Customer Service Management</h2>
          <p className="header-subtitle">Manage support topics, procedures, and customer service guidelines</p>
        </div>
        <div className="header-actions">
          <button className="reset-button" onClick={handleReset}>
            <span className="button-icon">🔄</span>
            Reset Topics
          </button>
          <button className="add-button" onClick={handleAddTopic}>
            <span className="button-icon">➕</span>
            Add New Topic
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Topics</h3>
            <div className="stat-number">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card urgent">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Urgent Topics</h3>
            <div className="stat-number">{stats.urgent}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>Categories</h3>
            <div className="stat-number">{categories.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Active</h3>
            <div className="stat-number">{stats.total - stats.urgent}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Controls Section */}
      <div className="management-controls">
        <div className="search-filter">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title">Sort by Title</option>
            <option value="category">Sort by Category</option>
            <option value="urgent">Sort by Urgency</option>
          </select>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="topics-grid">
        {filteredAndSortedTopics.map(topic => (
          <div key={topic.id} className={`topic-card ${topic.isUrgent ? 'urgent' : ''}`}>
            <div className="card-header">
              <div className="topic-icon">
                <span className="icon">{topic.icon || EMOJI_ICONS[topic.category] || '💬'}</span>
              </div>
              <div className="card-actions">
                <button 
                  className="edit-button" 
                  onClick={() => handleEditTopic(topic)}
                  title="Edit topic"
                >
                  ✏️
                </button>
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteTopic(topic)}
                  title="Delete topic"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="card-content">
              <h3 className="topic-title">{topic.title}</h3>
              <p className="topic-description">{topic.description}</p>
              
              <div className="topic-meta">
                <span className="category-badge">
                  <span className="category-icon">{EMOJI_ICONS[topic.category] || '💬'}</span>
                  {topic.category}
                </span>
                {topic.isUrgent && (
                  <span className="urgent-badge">Urgent</span>
                )}
              </div>

              <div className="topic-stats">
                <div className="stat-item">
                  <span className="stat-label">Steps</span>
                  <span className="stat-value">{topic.steps?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Tips</span>
                  <span className="stat-value">{topic.tips?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Keywords</span>
                  <span className="stat-value">{topic.keywords?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedTopics.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No topics found</h3>
          <p>Create your first customer service topic to get started!</p>
          <button className="add-button" onClick={handleAddTopic}>
            <span className="button-icon">➕</span>
            Add New Topic
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
        }}>
          <div className="topic-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showAddModal ? 'Add New Topic' : 'Edit Topic'}</h2>
              <button 
                className="close-modal" 
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="topic-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter topic title"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Describe the topic..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Topic</label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="Enter topic keyword"
                  />
                </div>
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-input-container">
                    <input
                      type="text"
                      className="icon-input"
                      value={formData.icon}
                      onChange={handleInputChange}
                      name="icon"
                      onClick={() => setShowIconPicker(true)}
                      placeholder="Click to select icon"
                      readOnly
                    />
                    <div className="icon-preview">
                      {formData.icon || EMOJI_ICONS[formData.category] || '💬'}
                    </div>
                  </div>
                  {showIconPicker && (
                    <div className="icon-picker">
                      <div className="icon-picker-grid">
                        {Object.values(EMOJI_ICONS).map((icon, index) => (
                          <button
                            key={index}
                            className="icon-picker-item"
                            onClick={() => handleIconSelect(icon)}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Steps */}
              <div className="form-group">
                <label>Steps</label>
                {formData.steps.map((step, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'steps')}
                      placeholder={`Step ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeArrayItem(index, 'steps')}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-array-button"
                  onClick={() => addArrayItem('steps')}
                >
                  + Add Step
                </button>
              </div>

              {/* Tips */}
              <div className="form-group">
                <label>Tips & Best Practices</label>
                {formData.tips.map((tip, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={tip}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'tips')}
                      placeholder={`Tip ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeArrayItem(index, 'tips')}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-array-button"
                  onClick={() => addArrayItem('tips')}
                >
                  + Add Tip
                </button>
              </div>

              {/* Keywords */}
              <div className="form-group">
                <label>Keywords</label>
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleArrayInputChange(index, e.target.value, 'keywords')}
                      placeholder={`Keyword ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeArrayItem(index, 'keywords')}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-array-button"
                  onClick={() => addArrayItem('keywords')}
                >
                  + Add Keyword
                </button>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isUrgent"
                    checked={formData.isUrgent}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Mark as Urgent
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {showAddModal ? 'Create Topic' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-header">
              <div className="warning-icon">⚠️</div>
              <h2>Delete Topic</h2>
            </div>
            <div className="delete-content">
              <p>Are you sure you want to delete <strong>"{selectedTopic?.title}"</strong>?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="delete-actions">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="delete-button"
                onClick={handleDelete}
              >
                Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerServiceManagement; 