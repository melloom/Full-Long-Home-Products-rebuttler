import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRebuttals, deleteRebuttal, updateRebuttal } from '../../services/firebase/rebuttals';
import categoryService from '../../services/categoryService';
import RebuttalForm from './RebuttalForm';
import './RebuttalManagement.css';

const RebuttalManagement = () => {
  const [rebuttals, setRebuttals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRebuttal, setEditingRebuttal] = useState(null);
  const [selectedRebuttals, setSelectedRebuttals] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [fixingCategories, setFixingCategories] = useState(false);
  const [fixWarnings, setFixWarnings] = useState([]);
  const navigate = useNavigate();
  const modalContentRef = useRef(null);

  useEffect(() => {
    loadRebuttals();
  }, []);

  // Scroll modal to top when opening
  useEffect(() => {
    if (showForm && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [showForm]);

  const loadRebuttals = async () => {
    try {
      setLoading(true);
      const rebuttalsData = await getAllRebuttals();
      
      // Check and fix category names if needed
      const fixedRebuttals = await checkAndFixCategoryNames(rebuttalsData);
      
      setRebuttals(fixedRebuttals);
    } catch (error) {
      console.error('Error loading rebuttals:', error);
      setError('Failed to load rebuttals');
    } finally {
      setLoading(false);
    }
  };

  // Improved fix function
  const checkAndFixCategoryNames = async (rebuttals, showAlert = true) => {
    try {
      setFixingCategories(true);
      setFixWarnings([]);
      // Get all categories to create a mapping
      const categories = await categoryService.getAllCategories();
      const categoryMap = {};
      categories.forEach(category => {
        categoryMap[category.id] = category.name;
      });
      let hasChanges = false;
      const updatedRebuttals = [];
      const warnings = [];
      for (const rebuttal of rebuttals) {
        const currentCategory = rebuttal.category;
        let updatedRebuttal = { ...rebuttal };
        // Check if the category is a UID (Firestore document ID format)
        if (currentCategory && currentCategory.length === 20 && !currentCategory.includes(' ')) {
          const categoryName = categoryMap[currentCategory];
          if (categoryName) {
            await updateRebuttal(rebuttal.id, {
              ...rebuttal,
              category: categoryName
            });
            updatedRebuttal.category = categoryName;
            hasChanges = true;
          } else {
            warnings.push(`Could not find category name for UID: ${currentCategory} (Rebuttal: ${rebuttal.title})`);
          }
        }
        updatedRebuttals.push(updatedRebuttal);
      }
      if (showAlert && warnings.length > 0) {
        setFixWarnings(warnings);
        setTimeout(() => setFixWarnings([]), 10000);
      }
      setFixingCategories(false);
      return updatedRebuttals;
    } catch (error) {
      setFixingCategories(false);
      console.error('Error checking/fixing category names:', error);
      return rebuttals;
    }
  };

  // Manual fix trigger
  const handleManualFixCategories = async () => {
    setFixingCategories(true);
    const rebuttalsData = await getAllRebuttals();
    const fixedRebuttals = await checkAndFixCategoryNames(rebuttalsData, true);
    setRebuttals(fixedRebuttals);
    setFixingCategories(false);
  };

  const handleDelete = async (rebuttalId) => {
    if (window.confirm('Are you sure you want to delete this rebuttal? This action cannot be undone.')) {
      try {
        await deleteRebuttal(rebuttalId);
        setRebuttals(rebuttals.filter(r => r.id !== rebuttalId));
      } catch (error) {
        console.error('Error deleting rebuttal:', error);
        setError('Failed to delete rebuttal');
      }
    }
  };

  const handleArchive = async (rebuttalId) => {
    try {
      await updateRebuttal(rebuttalId, { archived: true, archivedAt: new Date().toISOString() });
      setRebuttals(rebuttals.map(r => 
        r.id === rebuttalId ? { ...r, archived: true, archivedAt: new Date().toISOString() } : r
      ));
    } catch (error) {
      console.error('Error archiving rebuttal:', error);
      setError('Failed to archive rebuttal');
    }
  };

  const handleUnarchive = async (rebuttalId) => {
    try {
      await updateRebuttal(rebuttalId, { archived: false, archivedAt: null });
      setRebuttals(rebuttals.map(r => 
        r.id === rebuttalId ? { ...r, archived: false, archivedAt: null } : r
      ));
    } catch (error) {
      console.error('Error unarchiving rebuttal:', error);
      setError('Failed to unarchive rebuttal');
    }
  };

  const handleEdit = (rebuttal) => {
    // Map Firestore fields to form fields expected by the form
    const mapped = {
      ...rebuttal,
      summary: rebuttal.summary || rebuttal.objection || '',
      situationOverview: rebuttal.situationOverview || rebuttal.summary || rebuttal.objection || '',
      rebuttalStrategy: rebuttal.rebuttalStrategy || '',
      content: rebuttal.content
        ? (typeof rebuttal.content === 'object'
            ? rebuttal.content
            : { pt1: rebuttal.content, pt2: '' })
        : (rebuttal.response
            ? (typeof rebuttal.response === 'object'
                ? rebuttal.response
                : { pt1: rebuttal.response, pt2: '' })
            : { pt1: '', pt2: '' }),
      tips: rebuttal.tips || [],
    };
    setEditingRebuttal(mapped);
    setShowForm(true);
  };

  const handleFormClose = () => {
    console.log('handleFormClose called');
    // Add a small delay for smooth animation
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.animation = 'modalSlideOut 0.2s ease-in forwards';
      setTimeout(() => {
        setShowForm(false);
        setEditingRebuttal(null);
        loadRebuttals(); // Refresh the list
      }, 200);
    } else {
      setShowForm(false);
      setEditingRebuttal(null);
      loadRebuttals(); // Refresh the list
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedRebuttals.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        if (window.confirm(`Are you sure you want to delete ${selectedRebuttals.length} rebuttals?`)) {
          await Promise.all(selectedRebuttals.map(id => deleteRebuttal(id)));
          setRebuttals(rebuttals.filter(r => !selectedRebuttals.includes(r.id)));
        }
      } else if (bulkAction === 'archive') {
        await Promise.all(selectedRebuttals.map(id => 
          updateRebuttal(id, { archived: true, archivedAt: new Date().toISOString() })
        ));
        setRebuttals(rebuttals.map(r => 
          selectedRebuttals.includes(r.id) 
            ? { ...r, archived: true, archivedAt: new Date().toISOString() }
            : r
        ));
      } else if (bulkAction === 'unarchive') {
        await Promise.all(selectedRebuttals.map(id => 
          updateRebuttal(id, { archived: false, archivedAt: null })
        ));
        setRebuttals(rebuttals.map(r => 
          selectedRebuttals.includes(r.id) 
            ? { ...r, archived: false, archivedAt: null }
            : r
        ));
      }
      setSelectedRebuttals([]);
      setBulkAction('');
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    }
  };

  const handleSelectAll = () => {
    if (selectedRebuttals.length === filteredRebuttals.length) {
      setSelectedRebuttals([]);
    } else {
      setSelectedRebuttals(filteredRebuttals.map(r => r.id));
    }
  };

  const handleSelectRebuttal = (rebuttalId) => {
    setSelectedRebuttals(prev => 
      prev.includes(rebuttalId) 
        ? prev.filter(id => id !== rebuttalId)
        : [...prev, rebuttalId]
    );
  };

  // Filter and search rebuttals
  const filteredRebuttals = rebuttals.filter(rebuttal => {
    const matchesSearch = rebuttal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rebuttal.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rebuttal.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rebuttal.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !categoryFilter || rebuttal.category === categoryFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'archived' && rebuttal.archived) ||
                         (statusFilter === 'active' && !rebuttal.archived);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(rebuttals.map(r => r.category).filter(Boolean))];

  return (
    <>
      {showForm && (
        <div className="modal-overlay" onClick={handleFormClose}>
          <div
            className="modal-content modern-modal"
            ref={modalContentRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header modern-modal-header">
              <h2>{editingRebuttal ? 'Edit Rebuttal' : 'Add New Rebuttal'}</h2>
              <button onClick={handleFormClose} className="modal-close-btn modern-modal-close">
                ×
              </button>
            </div>
            <div className="modal-body modern-modal-body">
              <RebuttalForm rebuttal={editingRebuttal} onSave={handleFormClose} />
            </div>
          </div>
        </div>
      )}

      {/* Show the main content behind the modal */}
      <div className="rebuttal-management">
        <div className="management-header">
          <div className="header-content">
            <h1>Rebuttal Management</h1>
            <p>Manage all rebuttals in the system. Create, edit, archive, and delete rebuttals.</p>
          </div>
          <div className="header-actions">
            <button 
              className="add-rebuttal-btn"
              onClick={() => {
                setEditingRebuttal(null);
                setShowForm(true);
              }}
            >
              ➕ Add New Rebuttal
            </button>
            <button
              className="fix-categories-btn"
              onClick={handleManualFixCategories}
              disabled={fixingCategories}
              style={{ marginLeft: '1rem', background: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: fixingCategories ? 'not-allowed' : 'pointer' }}
            >
              {fixingCategories ? 'Fixing...' : 'Fix Category Names'}
            </button>
          </div>
        </div>
        {fixWarnings.length > 0 && (
          <div className="fix-warning-toast">
            <strong>Warning:</strong>
            <ul>
              {fixWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search rebuttals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRebuttals.length > 0 && (
          <div className="bulk-actions">
            <div className="bulk-info">
              {selectedRebuttals.length} rebuttal(s) selected
            </div>
            <div className="bulk-controls">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bulk-select"
              >
                <option value="">Select Action</option>
                <option value="archive">Archive Selected</option>
                <option value="unarchive">Unarchive Selected</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="bulk-action-btn"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Rebuttals Table & Mobile Cards */}
        <div className="rebuttals-table-container">
          {/* Mobile Card Layout */}
          <div className="mobile-rebuttal-cards">
            {filteredRebuttals.map(rebuttal => (
              <div key={rebuttal.id} className={`rebuttal-card${rebuttal.archived ? ' archived' : ''}`}>
                <div className="rebuttal-card-header">
                  <div className="rebuttal-card-title">{rebuttal.title}</div>
                  <span className="category-badge">{rebuttal.category}</span>
                </div>
                <div className="rebuttal-card-summary">{rebuttal.summary}</div>
                <div className="rebuttal-card-tags">
                  {rebuttal.tags?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="tag-badge">#{tag}</span>
                  ))}
                  {rebuttal.tags?.length > 3 && (
                    <span className="more-tags">+{rebuttal.tags.length - 3}</span>
                  )}
                </div>
                <div className="rebuttal-card-status">
                  <span className={`status-badge ${rebuttal.archived ? 'archived' : 'active'}`}>{rebuttal.archived ? 'Archived' : 'Active'}</span>
                  <span className="date-info">{new Date(rebuttal.createdAt?.toDate?.() || rebuttal.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="rebuttal-card-actions">
                  <button onClick={() => handleEdit(rebuttal)} className="action-btn edit" title="Edit">✏️</button>
                  {rebuttal.archived ? (
                    <button onClick={() => handleUnarchive(rebuttal.id)} className="action-btn unarchive" title="Unarchive">📦</button>
                  ) : (
                    <button onClick={() => handleArchive(rebuttal.id)} className="action-btn archive" title="Archive">📦</button>
                  )}
                  <button onClick={() => handleDelete(rebuttal.id)} className="action-btn delete" title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table Layout */}
          <table className="rebuttals-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedRebuttals.length === filteredRebuttals.length}
                    onChange={handleSelectAll}
                    className="select-all-checkbox"
                  />
                </th>
                <th>Title</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRebuttals.map(rebuttal => (
                <tr key={rebuttal.id} className={rebuttal.archived ? 'archived' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRebuttals.includes(rebuttal.id)}
                      onChange={() => handleSelectRebuttal(rebuttal.id)}
                      className="rebuttal-checkbox"
                    />
                  </td>
                  <td>
                    <div className="rebuttal-title">
                      <strong>{rebuttal.title}</strong>
                      <p className="rebuttal-summary">{rebuttal.summary}</p>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{rebuttal.category}</span>
                  </td>
                  <td>
                    <div className="tags-container">
                      {rebuttal.tags?.slice(0, 3).map((tag, index) => (
                        <span key={index} className="tag-badge">#{tag}</span>
                      ))}
                      {rebuttal.tags?.length > 3 && (
                        <span className="more-tags">+{rebuttal.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${rebuttal.archived ? 'archived' : 'active'}`}>{rebuttal.archived ? 'Archived' : 'Active'}</span>
                  </td>
                  <td>
                    <div className="date-info">
                      {new Date(rebuttal.createdAt?.toDate?.() || rebuttal.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(rebuttal)}
                        className="action-btn edit"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {rebuttal.archived ? (
                        <button
                          onClick={() => handleUnarchive(rebuttal.id)}
                          className="action-btn unarchive"
                          title="Unarchive"
                        >
                          📦
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(rebuttal.id)}
                          className="action-btn archive"
                          title="Archive"
                        >
                          📦
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rebuttal.id)}
                        className="action-btn delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="stats-footer">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{rebuttals.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value">{rebuttals.filter(r => !r.archived).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Archived:</span>
            <span className="stat-value">{rebuttals.filter(r => r.archived).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Categories:</span>
            <span className="stat-value">{categories.length}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default RebuttalManagement; 