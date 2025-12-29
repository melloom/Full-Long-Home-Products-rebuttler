import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRebuttal, getRebuttal, updateRebuttal } from '../../../services/firebase/rebuttals';
import categoryService from '../../../services/categoryService';
import './RebuttalForm.css';

// Pre-made tags for common rebuttal categories
const PREMADE_TAGS = [
  'Price Concern',
  'Time Constraint',
  'Spouse Decision',
  'Budget Issues',
  'Not Ready',
  'Competitor Comparison',
  'Quality Concerns',
  'Installation Time',
  'Warranty Questions',
  'Financing Options',
  'Custom Design',
  'Material Selection',
  'Maintenance',
  'Rescheduling',
  'Emergency Service'
];

const RebuttalForm = ({ rebuttal, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: { pt1: '', pt2: '' },
    tags: [],
    category: '',
    situationOverview: '',
    rebuttalStrategy: '',
    tips: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTip, setNewTip] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id) || Boolean(rebuttal);

  useEffect(() => {
    loadCategories();
  }, []);

  // Populate form data when rebuttal prop changes
  useEffect(() => {
    if (rebuttal && isEditing) {
      console.log('Populating form with rebuttal data:', rebuttal);
      
      const newFormData = {
        title: rebuttal.title || '',
        summary: rebuttal.summary || '',
        content: {
          pt1: typeof rebuttal.content === 'object' ? rebuttal.content.pt1 || '' : rebuttal.content || '',
          pt2: typeof rebuttal.content === 'object' ? rebuttal.content.pt2 || '' : ''
        },
        tags: rebuttal.tags || [],
        category: rebuttal.category || '',
        situationOverview: rebuttal.situationOverview || '',
        rebuttalStrategy: rebuttal.rebuttalStrategy || '',
        tips: rebuttal.tips || []
      };
      
      console.log('Setting form data to:', newFormData);
      setFormData(newFormData);
    }
  }, [rebuttal, isEditing]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await categoryService.getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadRebuttal = async () => {
    try {
      const rebuttal = await getRebuttal(id);
      if (rebuttal) {
        const newFormData = {
          title: rebuttal.title || '',
          summary: rebuttal.summary || '',
          content: {
            pt1: typeof rebuttal.content === 'object' ? rebuttal.content.pt1 || '' : rebuttal.content || '',
            pt2: typeof rebuttal.content === 'object' ? rebuttal.content.pt2 || '' : ''
          },
          tags: rebuttal.tags || [],
          category: rebuttal.category || '',
          situationOverview: rebuttal.situationOverview || '',
          rebuttalStrategy: rebuttal.rebuttalStrategy || '',
          tips: rebuttal.tips || []
        };
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error loading rebuttal:', error);
      setError('Error loading rebuttal');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (part, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [part]: value
      }
    }));
  };

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setNewTag(value);
    
    // Filter pre-made tags based on input
    if (value.trim()) {
      const filtered = PREMADE_TAGS.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) &&
        !formData.tags.includes(tag)
      );
      setFilteredTags(filtered);
      setShowTagDropdown(true);
    } else {
      setFilteredTags([]);
      setShowTagDropdown(false);
    }
  };

  const handleAddTag = (tag) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && !formData.tags.includes(tagToAdd)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd]
      }));
      setNewTag('');
      setShowTagDropdown(false);
      setFilteredTags([]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddTip = () => {
    if (newTip.trim() && !formData.tips.includes(newTip.trim())) {
      setFormData(prev => ({
        ...prev,
        tips: [...prev.tips, newTip.trim()]
      }));
      setNewTip('');
    }
  };

  const handleRemoveTip = (tipToRemove) => {
    setFormData(prev => ({
      ...prev,
      tips: prev.tips.filter(tip => tip !== tipToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const rebuttalData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (isEditing) {
        const rebuttalId = rebuttal?.id || id;
        await updateRebuttal(rebuttalId, rebuttalData);
      } else {
        rebuttalData.createdAt = new Date().toISOString();
        await addRebuttal(rebuttalData);
      }

      if (onSave) {
        onSave();
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Error saving rebuttal:', error);
      setError('Error saving rebuttal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-admin-form">
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">📝</div>
            <h3>Basic Information</h3>
            <p>Essential details about the rebuttal</p>
          </div>
          
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="title">
                <span className="label-icon">📝</span>
                <span className="label-text">Title</span>
                <span className="required-indicator">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter rebuttal title"
                  className="form-input"
                />
                <div className="input-icon">📝</div>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="category">
                <span className="label-icon">🏷️</span>
                <span className="label-text">Category</span>
                <span className="required-indicator">*</span>
              </label>
              <div className="input-wrapper">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={categoriesLoading}
                  className="form-select"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                <div className="input-icon">🏷️</div>
              </div>
              {categoriesLoading && <div className="loading-indicator">Loading categories...</div>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="summary">
              <span className="label-icon">📋</span>
              <span className="label-text">Summary</span>
              <span className="required-indicator">*</span>
            </label>
            <div className="input-wrapper">
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleInputChange}
                required
                rows="3"
                placeholder="Enter a brief summary of the rebuttal"
                className="form-textarea"
              />
              <div className="input-icon">📋</div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">🎯</div>
            <h3>Strategy & Content</h3>
            <p>Define the approach and detailed responses</p>
          </div>

          <div className="form-field">
            <label htmlFor="situationOverview">
              <span className="label-icon">🔍</span>
              <span className="label-text">Situation Overview</span>
              <span className="required-indicator">*</span>
            </label>
            <div className="input-wrapper">
              <textarea
                id="situationOverview"
                name="situationOverview"
                value={formData.situationOverview}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Describe the situation or objection being addressed"
                className="form-textarea"
              />
              <div className="input-icon">🔍</div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="rebuttalStrategy">
              <span className="label-icon">⚡</span>
              <span className="label-text">Rebuttal Strategy</span>
              <span className="required-indicator">*</span>
            </label>
            <div className="input-wrapper">
              <textarea
                id="rebuttalStrategy"
                name="rebuttalStrategy"
                value={formData.rebuttalStrategy}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Describe the overall strategy for this rebuttal"
                className="form-textarea"
              />
              <div className="input-icon">⚡</div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="content-pt1">
              <span className="label-icon">💬</span>
              <span className="label-text">Initial Response (Part 1)</span>
              <span className="required-indicator">*</span>
            </label>
            <div className="input-wrapper">
              <textarea
                id="content-pt1"
                value={formData.content.pt1}
                onChange={(e) => handleContentChange('pt1', e.target.value)}
                required
                rows="6"
                placeholder="Enter the initial response to the objection..."
                className="form-textarea"
              />
              <div className="input-icon">💬</div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="content-pt2">
              <span className="label-icon">🔄</span>
              <span className="label-text">Follow-up Response (Part 2)</span>
            </label>
            <div className="input-wrapper">
              <textarea
                id="content-pt2"
                value={formData.content.pt2}
                onChange={(e) => handleContentChange('pt2', e.target.value)}
                rows="6"
                placeholder="Enter the follow-up response if the initial response doesn't work..."
                className="form-textarea"
              />
              <div className="input-icon">🔄</div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <div className="section-icon">🏷️</div>
            <h3>Tags & Tips</h3>
            <p>Organize and enhance your rebuttal</p>
          </div>

          <div className="form-field">
            <label>
              <span className="label-icon">💡</span>
              <span className="label-text">Tips</span>
            </label>
            <div className="tags-input-container">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="Add a tip (e.g., 'Stay calm and professional')"
                  className="form-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTip();
                    }
                  }}
                />
                <div className="input-icon">💡</div>
              </div>
              <button type="button" onClick={handleAddTip} className="add-tag-btn">
                Add Tip
              </button>
            </div>
            <div className="tags-container">
              {formData.tips.map((tip, index) => (
                <span key={index} className="tag">
                  💡 {tip}
                  <button
                    type="button"
                    onClick={() => handleRemoveTip(tip)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>
              <span className="label-icon">🏷️</span>
              <span className="label-text">Tags</span>
            </label>
            <div className="tags-input-container">
              <div className="tags-input-wrapper">
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={newTag}
                    onChange={handleTagInputChange}
                    placeholder="Add a tag or select from suggestions"
                    className="form-input"
                  />
                  <div className="input-icon">🏷️</div>
                </div>
                {showTagDropdown && filteredTags.length > 0 && (
                  <div className="tags-dropdown">
                    {filteredTags.map((tag, index) => (
                      <div
                        key={index}
                        className="tag-suggestion"
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="add-tag-btn"
                disabled={!newTag.trim()}
              >
                Add Tag
              </button>
            </div>
            <div className="tags-container">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="remove-tag-btn"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="premade-tags">
              <h4>Common Tags:</h4>
              <div className="premade-tags-list">
                {PREMADE_TAGS.map((tag, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="premade-tag"
                    disabled={formData.tags.includes(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onSave}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </button>
        </div>
        </form>
      </div>
    );
};

export default RebuttalForm; 