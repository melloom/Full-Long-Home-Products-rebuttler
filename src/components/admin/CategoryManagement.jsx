import React, { useState, useEffect } from 'react';
import categoryService from '../../services/categoryService';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    color: '',
    isActive: true,
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Common emojis for categories
  const commonEmojis = [
    '📊', '📈', '📉', '📋', '📝', '📌', '📍', '🔍', '🔎', '🔐',
    '🔑', '🔒', '🔓', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️',
    '⏰', '⏱️', '⏲️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖',
    '🕗', '🕘', '🕙', '🕚', '🕛', '🎯', '🎨', '🎭', '🎪', '🎟️',
    '🎫', '🎬', '🎥', '📺', '📷', '📹', '🎞️', '📽️', '🎮', '🎲',
    '🧩', '🎨', '🎭', '🎪', '🎟️', '🎫', '🎬', '🎥', '📺', '📷',
    '📹', '🎞️', '📽️', '🎮', '🎲', '🧩', '🎯', '🎨', '🎪'
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await categoryService.getAllCategories();
      // Ensure all categories have isActive set
      const categoriesWithActiveState = fetchedCategories.map(category => ({
        ...category,
        isActive: category.isActive ?? true
      }));
      setCategories(categoriesWithActiveState);
      setError(null);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (dateString.toDate) {
        return dateString.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      // Handle ISO string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const categoryToAdd = {
        ...newCategory,
        isActive: true, // Ensure new categories are active
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await categoryService.addCategory(categoryToAdd);
      setShowAddModal(false);
      setNewCategory({
        name: '',
        icon: '',
        color: '',
        isActive: true,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category. Please try again.');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      const categoryToUpdate = {
        ...editingCategory,
        isActive: editingCategory.isActive ?? true, // Ensure active state is preserved
        updatedAt: new Date().toISOString()
      };
      await categoryService.updateCategory(editingCategory.id, categoryToUpdate);
      setShowEditModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category. Please try again.');
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category. Please try again.');
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (showAddModal) {
      setNewCategory({ ...newCategory, icon: emoji });
    } else if (showEditModal && editingCategory) {
      setEditingCategory({ ...editingCategory, icon: emoji });
    }
    setShowEmojiPicker(false);
  };

  if (loading) {
    return <div className="loading">Loading categories...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="category-management">
      <div className="category-header">
        <h2>Manage Categories</h2>
        <button 
          className="add-button"
          onClick={() => setShowAddModal(true)}
        >
          Add New Category
        </button>
      </div>

      <div className="categories-list redesigned">
        {categories.map(category => (
          <div key={category.id} className="category-card redesigned">
            <div className="category-card-main">
              <div className="category-card-icon" style={{ background: category.color ? `linear-gradient(135deg, ${category.color}33 0%, #fff 100%)` : '#f3f4f6' }}>
                <span className="icon-emoji">{category.icon}</span>
              </div>
              <div className="category-card-info">
                <div className="category-card-title">{category.name}</div>
                {category.description && (
                  <div className="category-card-desc">{category.description}</div>
                )}
                <div className="category-card-badges">
                  <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>{category.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <div className="category-card-meta">
              <div className="meta-item"><span className="meta-icon" role="img" aria-label="Created">📅</span> <span className="meta-label">Created:</span> <span className="meta-value">{formatDate(category.createdAt)}</span></div>
              {category.updatedAt && (
                <div className="meta-item"><span className="meta-icon" role="img" aria-label="Updated">🕒</span> <span className="meta-label">Updated:</span> <span className="meta-value">{formatDate(category.updatedAt)}</span></div>
              )}
            </div>
            <div className="category-card-actions">
              <button className="action-button edit-button" onClick={() => { setEditingCategory(category); setShowEditModal(true); }}>
                <span role="img" aria-label="Edit">✏️</span> Edit
              </button>
              <button className="action-button delete-button" onClick={() => { setCategoryToDelete(category); setShowDeleteModal(true); }}>
                <span role="img" aria-label="Delete">🗑️</span> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Enter a description for this category"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="emoji-input-container">
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                    placeholder="Click to select an emoji"
                    required
                    readOnly
                    onClick={() => setShowEmojiPicker(true)}
                  />
                  <span className="emoji-preview">{newCategory.icon}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <select
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                  required
                >
                  <option value="">Select a color</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="orange">Orange</option>
                  <option value="teal">Teal</option>
                  <option value="indigo">Indigo</option>
                  <option value="cyan">Cyan</option>
                  <option value="lime">Lime</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newCategory.isActive}
                    onChange={(e) => setNewCategory({...newCategory, isActive: e.target.checked})}
                  />
                  Active Category
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Add Category</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategory({ name: '', icon: '', color: '', isActive: true, description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
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
      {showEditModal && editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Category</h2>
            <form onSubmit={handleEditCategory}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                  placeholder="Enter a description for this category"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div className="emoji-input-container">
                  <input
                    type="text"
                    value={editingCategory.icon}
                    onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                    placeholder="Click to select an emoji"
                    required
                    readOnly
                    onClick={() => setShowEmojiPicker(true)}
                  />
                  <span className="emoji-preview">{editingCategory.icon}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <select
                  value={editingCategory.color}
                  onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})}
                  required
                >
                  <option value="">Select a color</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="orange">Orange</option>
                  <option value="teal">Teal</option>
                  <option value="indigo">Indigo</option>
                  <option value="cyan">Cyan</option>
                  <option value="lime">Lime</option>
                  <option value="amber">Amber</option>
                  <option value="rose">Rose</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingCategory.isActive}
                    onChange={(e) => setEditingCategory({...editingCategory, isActive: e.target.checked})}
                  />
                  Active Category
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">Save Changes</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Delete Category</h2>
            <p>Are you sure you want to delete the category "{categoryToDelete.name}"?</p>
            <p className="warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="delete-button"
                onClick={handleDeleteCategory}
              >
                Delete
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="modal-overlay emoji-picker-overlay">
          <div className="modal-content emoji-picker-content">
            <div className="emoji-picker-header">
              <h3>Select an Emoji</h3>
              <button 
                className="close-button"
                onClick={() => setShowEmojiPicker(false)}
              >
                ×
              </button>
            </div>
            <div className="emoji-grid">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  className="emoji-button"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement; 