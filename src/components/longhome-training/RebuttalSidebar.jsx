import React, { useState, useEffect } from 'react';
import rebuttalsService from '../../services/rebuttalsService';
import categoryService from '../../services/categoryService';
import './RebuttalLibrary.css';

const DEFAULT_TIPS = [
  "Listen actively and acknowledge the customer's concerns",
  "Stay calm and professional throughout the conversation",
  "Use positive language and focus on solutions",
  "Be prepared with relevant information and examples",
  "Follow up appropriately if needed"
];

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 300;

// Create a new component for rendering steps
const RebuttalSteps = ({ steps }) => {
  return (
    <div className="rebuttal-steps">
      {steps.map((step, index) => (
        <div key={index} className="rebuttal-step">
          <span className="step-number">{index + 1}</span>
          <span className="step-content">{step}</span>
        </div>
      ))}
    </div>
  );
};

const RebuttalSidebar = ({ collapsed: collapsedProp, onCollapseChange }) => {
  const [simpleModeCategories, setSimpleModeCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedRebuttal, setSelectedRebuttal] = useState(null);
  const [showRebuttalModal, setShowRebuttalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(collapsedProp || false);
  const [showCategoriesSidebar, setShowCategoriesSidebar] = useState(true);

  useEffect(() => {
    if (typeof collapsedProp === 'boolean') setCollapsed(collapsedProp);
  }, [collapsedProp]);

  // Keep sidebar expanded when any modal is open
  useEffect(() => {
    if ((showCategoryModal || showRebuttalModal) && collapsed) {
      setCollapsed(false);
      if (onCollapseChange) onCollapseChange(false);
    }
  }, [showCategoryModal, showRebuttalModal, collapsed, onCollapseChange]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fetchedCategories = await categoryService.getAllCategories();
      const rebuttals = await rebuttalsService.getAllRebuttals();
      const transformedCategories = fetchedCategories.map(category => {
        const categoryRebuttals = rebuttals.filter(rebuttal => {
          const rebuttalCategory = rebuttal.category || '';
          const categoryName = category.name || '';
          const categoryId = category.id || '';
          return rebuttalCategory === categoryName || rebuttalCategory === categoryId || rebuttalCategory.toLowerCase() === categoryName.toLowerCase();
        });
        return {
          id: category.id,
          name: category.name,
          description: category.description || '',
          icon: category.icon || '📋',
          color: category.color || '#808080',
          items: categoryRebuttals.map(rebuttal => {
            let content = { pt1: '', pt2: '' };
            if (typeof rebuttal.content === 'string') {
              content.pt1 = rebuttal.content;
            } else if (rebuttal.content && typeof rebuttal.content === 'object') {
              content = {
                pt1: rebuttal.content.pt1 || rebuttal.content.initial || rebuttal.content.part1 || '',
                pt2: rebuttal.content.pt2 || rebuttal.content.followup || rebuttal.content.part2 || ''
              };
            } else if (typeof rebuttal.response === 'string') {
              content.pt1 = rebuttal.response;
            } else if (rebuttal.response && typeof rebuttal.response === 'object') {
              content = {
                pt1: rebuttal.response.pt1 || rebuttal.response.initial || rebuttal.response.part1 || '',
                pt2: rebuttal.response.pt2 || rebuttal.response.followup || rebuttal.response.part2 || ''
              };
            }
            if (!content.pt1) content.pt1 = rebuttal.objection || '';
            return {
              id: rebuttal.id,
              title: rebuttal.title,
              description: rebuttal.description || rebuttal.objection || rebuttal.summary || '',
              category: category.id,
              content: content,
              steps: rebuttal.steps || [
                'Listen to customer concerns',
                'Address specific needs',
                'Present solution',
                'Follow up as needed'
              ],
              tips: rebuttal.tips || [
                'Be professional and courteous',
                'Focus on customer needs',
                'Provide clear information'
              ],
              tags: rebuttal.tags || [],
              situationOverview: rebuttal.situationOverview || '',
              summary: rebuttal.summary || '',
              objection: rebuttal.objection || '',
              situations: rebuttal.situations || []
            };
          })
        };
      });
      setSimpleModeCategories(transformedCategories);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
    // Ensure sidebar is expanded when modal opens
    if (collapsed) {
      setCollapsed(false);
      if (onCollapseChange) onCollapseChange(false);
    }
  };

  const handleRebuttalClick = (rebuttal) => {
    setSelectedRebuttal(rebuttal);
    setShowRebuttalModal(true);
    setShowCategoryModal(false);
    // Ensure sidebar is expanded when modal opens
    if (collapsed) {
      setCollapsed(false);
      if (onCollapseChange) onCollapseChange(false);
    }
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory(null);
  };

  const closeRebuttalModal = () => {
    setShowRebuttalModal(false);
    setSelectedRebuttal(null);
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (onCollapseChange) onCollapseChange(next);
      return next;
    });
  };

  return (
    <>
      {/* Category sidebar removed */}
      {/* Modal for category rebuttal list */}
      {showCategoryModal && selectedCategory && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: '95%' }}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2 className="modal-title">{selectedCategory.name} Rebuttals</h2>
              </div>
              <button onClick={closeCategoryModal} className="modal-close-button">×</button>
            </div>
            <div className="modal-body">
              {selectedCategory.items.length === 0 ? (
                <div style={{ color: '#888', fontSize: 14 }}>No rebuttals in this category.</div>
              ) : (
                selectedCategory.items.map(rebuttal => (
                  <div key={rebuttal.id} className="library-rebuttal-card" style={{ cursor: 'pointer', marginBottom: 8, background: '#fff', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: 8 }} onClick={() => handleRebuttalClick(rebuttal)}>
                    <div className="library-rebuttal-content">
                      <div className="library-rebuttal-info">
                        <h4 className="library-rebuttal-title" style={{ fontSize: 15, margin: 0 }}>{rebuttal.title}</h4>
                        <p className="library-rebuttal-summary" style={{ fontSize: 13, color: '#666', margin: 0 }}>{rebuttal.summary}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal for rebuttal details */}
      {showRebuttalModal && selectedRebuttal && (
        <div className="modal-overlay" onClick={closeRebuttalModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, width: '95%' }}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2 className="modal-title">{selectedRebuttal.title}</h2>
              </div>
              <button onClick={closeRebuttalModal} className="modal-close-button">×</button>
            </div>
            <div className="modal-body">
              <div className="modal-tags">
                {selectedRebuttal.tags && selectedRebuttal.tags.map(tag => (
                  <span key={tag} className="modal-tag">#{tag}</span>
                ))}
              </div>
              <div className="modal-summary">
                <p className="modal-summary-text">{selectedRebuttal.situationOverview || selectedRebuttal.summary || selectedRebuttal.objection || 'No situation overview available.'}</p>
              </div>
              <div className="modal-rebuttal-content">
                {selectedRebuttal.content && (
                  <>
                    {selectedRebuttal.content.pt1 && <div style={{ marginBottom: 8 }}><b>Initial Response:</b> {selectedRebuttal.content.pt1}</div>}
                    {selectedRebuttal.content.pt2 && <div><b>Follow-up Response:</b> {selectedRebuttal.content.pt2}</div>}
                  </>
                )}
              </div>
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
            {/* Situations Used Section (optional) */}
            {selectedRebuttal.situations && selectedRebuttal.situations.length > 0 && (
              <div className="modal-situations">
                <div className="modal-section-header">
                  <span style={{ fontSize: 18, marginRight: 8 }}>🎯</span>
                  <h3>Situations Used</h3>
                </div>
                <div className="situations-list">
                  {selectedRebuttal.situations.map((situation, idx) => (
                    <div key={idx} className="situation-item">
                      <div className="situation-content">
                        <h4 className="situation-title">{situation.title}</h4>
                        <p className="situation-description">{situation.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-footer">
              <div className="modal-footer-note">
                💡 Pro Tip: Start with the Initial Response. If customer still objects, use the Follow-up Response
              </div>
              <button onClick={closeRebuttalModal} className="modal-close-footer-button">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RebuttalSidebar; 