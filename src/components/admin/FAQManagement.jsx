import React, { useState, useEffect } from 'react';
import faqService from '../../services/faqService';
import './FAQManagement.css';
import SearchBar from '../SearchBar';

const FAQManagement = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFAQ, setNewFAQ] = useState({
    question: '',
    answer: ''
  });

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFAQs = await faqService.getAllFAQs();
      setFaqs(fetchedFAQs);
    } catch (err) {
      console.error('Error loading FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    try {
      if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
        setError('Please fill in both question and answer fields.');
        return;
      }

      await faqService.addFAQ(newFAQ);
      setNewFAQ({ question: '', answer: '' });
      setShowAddModal(false);
      setError(null);
      loadFAQs();
    } catch (err) {
      console.error('Error adding FAQ:', err);
      setError('Failed to add FAQ. Please try again.');
    }
  };

  const handleEditFAQ = async (e) => {
    e.preventDefault();
    try {
      if (!editingFAQ.question.trim() || !editingFAQ.answer.trim()) {
        setError('Please fill in both question and answer fields.');
        return;
      }

      await faqService.updateFAQ(editingFAQ.id, {
        question: editingFAQ.question,
        answer: editingFAQ.answer
      });
      setEditingFAQ(null);
      setShowEditModal(false);
      setError(null);
      loadFAQs();
    } catch (err) {
      console.error('Error updating FAQ:', err);
      setError('Failed to update FAQ. Please try again.');
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await faqService.deleteFAQ(id);
        loadFAQs();
        setError(null);
      } catch (err) {
        console.error('Error deleting FAQ:', err);
        setError('Failed to delete FAQ. Please try again.');
      }
    }
  };

  const handleEditClick = (faq) => {
    setEditingFAQ({ ...faq });
    setShowEditModal(true);
  };

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="faq-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading FAQs...</p>
      </div>
    );
  }

  return (
    <div className="faq-management">
      <div className="faq-management-header">
        <h2>FAQ Management</h2>
        <div className="faq-actions">
          <button 
            className="add-faq-button"
            onClick={() => setShowAddModal(true)}
          >
            <span>➕</span> Add New FAQ
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="faq-search-section">
        <SearchBar
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search FAQs..."
        />
        <div className="search-results">
          {searchTerm && (
            <span className="results-count">
              {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      <div className="faq-list">
        {filteredFAQs.length === 0 ? (
          <div className="no-faqs">
            <div className="no-faqs-content">
              <span className="no-faqs-icon">❓</span>
              <h3>No FAQs found</h3>
              <p>
                {searchTerm 
                  ? 'No FAQs match your search criteria.' 
                  : 'No FAQs have been added yet. Click "Add New FAQ" to get started.'
                }
              </p>
            </div>
          </div>
        ) : (
          filteredFAQs.map((faq) => (
            <div key={faq.id} className="faq-item-admin">
              <div className="faq-content">
                <div className="faq-question-admin">
                  <h3>{faq.question}</h3>
                </div>
                <div className="faq-answer-admin">
                  <p>{faq.answer}</p>
                </div>
                <div className="faq-meta">
                  <span className="faq-date">
                    Created: {faq.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </span>
                  {faq.updatedAt && faq.updatedAt !== faq.createdAt && (
                    <span className="faq-updated">
                      Updated: {faq.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
              <div className="faq-actions-admin">
                <button
                  className="edit-faq-button"
                  onClick={() => handleEditClick(faq)}
                  title="Edit FAQ"
                >
                  ✏️
                </button>
                <button
                  className="delete-faq-button"
                  onClick={() => handleDeleteFAQ(faq.id)}
                  title="Delete FAQ"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add FAQ Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => {
                setShowAddModal(false);
                setNewFAQ({ question: '', answer: '' });
                setError(null);
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Add New FAQ</h2>
            <form onSubmit={handleAddFAQ}>
              <div className="form-group">
                <label className="required">Question</label>
                <input
                  type="text"
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({...newFAQ, question: e.target.value})}
                  placeholder="Enter the question..."
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Answer</label>
                <textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({...newFAQ, answer: e.target.value})}
                  rows={6}
                  placeholder="Enter the answer..."
                  required
                />
                <div className="char-count">
                  {newFAQ.answer.length} characters
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">
                  Add FAQ
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewFAQ({ question: '', answer: '' });
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit FAQ Modal */}
      {showEditModal && editingFAQ && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit FAQ</h2>
            <form onSubmit={handleEditFAQ}>
              <div className="form-group">
                <label className="required">Question</label>
                <input
                  type="text"
                  value={editingFAQ.question}
                  onChange={(e) => setEditingFAQ({...editingFAQ, question: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="required">Answer</label>
                <textarea
                  value={editingFAQ.answer}
                  onChange={(e) => setEditingFAQ({...editingFAQ, answer: e.target.value})}
                  rows={6}
                  required
                />
                <div className="char-count">
                  {editingFAQ.answer.length} characters
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="submit-button">
                  Update FAQ
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFAQ(null);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQManagement; 