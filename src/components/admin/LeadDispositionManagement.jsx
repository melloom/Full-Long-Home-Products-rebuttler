import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import './LeadDispositionManagement.css';

const LeadDispositionManagement = () => {
  const [dispositions, setDispositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDisposition, setEditingDisposition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDispositions, setSelectedDispositions] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const db = getFirestore();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    icon: '📋',
    nextSteps: '',
    situations: [''],
    tips: [''],
    examples: [''],
    subcategories: [''],
    isActive: true
  });

  useEffect(() => {
    fetchDispositions();
  }, []);

  const fetchDispositions = async () => {
    try {
      setLoading(true);
      const dispositionsRef = collection(db, 'dispositions');
      const snapshot = await getDocs(dispositionsRef);
      const dispositionsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setDispositions(dispositionsData);
    } catch (err) {
      console.error('Error fetching dispositions:', err);
      setError('Failed to load dispositions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dispositionsRef = collection(db, 'dispositions');
      
      // Clean up empty arrays
      const cleanData = {
        ...formData,
        situations: formData.situations.filter(s => s.trim()),
        tips: formData.tips.filter(t => t.trim()),
        examples: formData.examples.filter(e => e.trim()),
        subcategories: formData.subcategories.filter(s => s.trim())
      };

      if (editingDisposition) {
        await updateDoc(doc(db, 'dispositions', editingDisposition.id), cleanData);
      } else {
        await addDoc(dispositionsRef, cleanData);
      }

      setShowModal(false);
      setEditingDisposition(null);
      resetForm();
      fetchDispositions();
    } catch (err) {
      console.error('Error saving disposition:', err);
      setError('Failed to save disposition');
    }
  };

  const handleEdit = (disposition) => {
    setEditingDisposition(disposition);
    setFormData({
      name: disposition.name || '',
      description: disposition.description || '',
      category: disposition.category || '',
      icon: disposition.icon || '📋',
      nextSteps: disposition.nextSteps || '',
      situations: disposition.situations || [''],
      tips: disposition.tips || [''],
      examples: disposition.examples || [''],
      subcategories: disposition.subcategories || [''],
      isActive: disposition.isActive === undefined ? true : disposition.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this disposition?')) {
      try {
        await deleteDoc(doc(db, 'dispositions', id));
        fetchDispositions();
      } catch (err) {
        console.error('Error deleting disposition:', err);
        setError('Failed to delete disposition');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedDispositions.length} dispositions?`)) {
      try {
        const deletePromises = selectedDispositions.map(id => 
          deleteDoc(doc(db, 'dispositions', id))
        );
        await Promise.all(deletePromises);
        setSelectedDispositions([]);
        setShowBulkActions(false);
        fetchDispositions();
      } catch (err) {
        console.error('Error bulk deleting dispositions:', err);
        setError('Failed to delete dispositions');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      icon: '📋',
      nextSteps: '',
      situations: [''],
      tips: [''],
      examples: [''],
      subcategories: [''],
      isActive: true
    });
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const filteredDispositions = dispositions.filter(disposition => {
    const matchesSearch = disposition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disposition.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || disposition.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(dispositions.map(d => d.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dispositions...</p>
      </div>
    );
  }

  return (
    <div className="lead-disposition-management">
      <div className="management-header">
        <h2>Lead Disposition Management</h2>
        <div className="header-actions">
          <button 
            className="fix-button"
            onClick={async () => {
              try {
                const dispositionsRef = collection(db, 'dispositions');
                const snapshot = await getDocs(dispositionsRef);
                const updatePromises = snapshot.docs.map(doc => {
                  const data = doc.data();
                  if (data.isActive === undefined) {
                    return updateDoc(doc.ref, { isActive: true });
                  }
                  return Promise.resolve();
                });
                await Promise.all(updatePromises);
                fetchDispositions();
                setError('Fixed existing dispositions!');
                setTimeout(() => setError(null), 3000);
              } catch (err) {
                console.error('Error fixing dispositions:', err);
                setError('Failed to fix dispositions');
              }
            }}
          >
            🔧 Fix Existing Dispositions
          </button>
          <button 
            className="add-button"
            onClick={() => {
              setEditingDisposition(null);
              resetForm();
              setShowModal(true);
            }}
          >
            ➕ Add New Disposition
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="management-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search dispositions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="bulk-actions">
          <label className="select-all">
            <input
              type="checkbox"
              checked={selectedDispositions.length === filteredDispositions.length && filteredDispositions.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedDispositions(filteredDispositions.map(d => d.id));
                } else {
                  setSelectedDispositions([]);
                }
              }}
            />
            Select All
          </label>
          {selectedDispositions.length > 0 && (
            <div className="bulk-action-buttons">
              <button 
                className="bulk-delete-button"
                onClick={handleBulkDelete}
              >
                🗑️ Delete Selected ({selectedDispositions.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dispositions-grid">
        {filteredDispositions.map(disposition => (
          <div key={disposition.id} className="disposition-card">
            <div className="card-header">
              <input
                type="checkbox"
                checked={selectedDispositions.includes(disposition.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDispositions(prev => [...prev, disposition.id]);
                  } else {
                    setSelectedDispositions(prev => prev.filter(id => id !== disposition.id));
                  }
                }}
                className="select-checkbox"
              />
              <span className="disposition-icon">{disposition.icon}</span>
              <h3 className="disposition-name">{disposition.name}</h3>
              <span className={`status-badge ${disposition.isActive === undefined || disposition.isActive ? 'active' : 'inactive'}`}>
                {disposition.isActive === undefined || disposition.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="card-content">
              <p className="disposition-description">{disposition.description}</p>
              {disposition.category && (
                <span className="disposition-category">{disposition.category}</span>
              )}
              
              {/* Next Steps */}
              {disposition.nextSteps && (
                <div className="disposition-details">
                  <h4 className="detail-title">Next Steps:</h4>
                  <p className="detail-text">{disposition.nextSteps}</p>
                </div>
              )}
              
              {/* Tips */}
              {disposition.tips && disposition.tips.length > 0 && (
                <div className="disposition-details">
                  <h4 className="detail-title">Tips & Best Practices:</h4>
                  <ul className="detail-list">
                    {disposition.tips.map((tip, index) => (
                      <li key={index} className="detail-item">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Examples */}
              {disposition.examples && disposition.examples.length > 0 && (
                <div className="disposition-details">
                  <h4 className="detail-title">Common Examples:</h4>
                  <ul className="detail-list">
                    {disposition.examples.map((example, index) => (
                      <li key={index} className="detail-item">{example}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Subcategories */}
              {disposition.subcategories && disposition.subcategories.length > 0 && (
                <div className="disposition-details">
                  <h4 className="detail-title">Subcategories:</h4>
                  <div className="subcategories-container">
                    {disposition.subcategories.map((subcategory, index) => (
                      <span key={index} className="subcategory-tag">{subcategory}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button 
                className="edit-button"
                onClick={() => handleEdit(disposition)}
              >
                ✏️ Edit
              </button>
              <button 
                className="delete-button"
                onClick={() => handleDelete(disposition.id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDispositions.length === 0 && (
        <div className="empty-state">
          <p>No dispositions found. Create your first disposition to get started!</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDisposition ? 'Edit Disposition' : 'Add New Disposition'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="disposition-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📋"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Next Steps</label>
                <textarea
                  value={formData.nextSteps}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextSteps: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Situations */}
              <div className="form-group">
                <label>Situations</label>
                {formData.situations.map((situation, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={situation}
                      onChange={(e) => updateArrayItem('situations', index, e.target.value)}
                      placeholder="When to use this disposition..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('situations', index)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('situations')}
                  className="add-array-button"
                >
                  + Add Situation
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
                      onChange={(e) => updateArrayItem('tips', index, e.target.value)}
                      placeholder="Tip or best practice..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tips', index)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('tips')}
                  className="add-array-button"
                >
                  + Add Tip
                </button>
              </div>

              {/* Examples */}
              <div className="form-group">
                <label>Examples</label>
                {formData.examples.map((example, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => updateArrayItem('examples', index, e.target.value)}
                      placeholder="Common example..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('examples', index)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('examples')}
                  className="add-array-button"
                >
                  + Add Example
                </button>
              </div>

              {/* Subcategories */}
              <div className="form-group">
                <label>Subcategories</label>
                {formData.subcategories.map((subcategory, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => updateArrayItem('subcategories', index, e.target.value)}
                      placeholder="Subcategory name..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('subcategories', index)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('subcategories')}
                  className="add-array-button"
                >
                  + Add Subcategory
                </button>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  {editingDisposition ? 'Update' : 'Create'} Disposition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDispositionManagement; 