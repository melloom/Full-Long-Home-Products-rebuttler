import React, { useState, useEffect } from 'react';
import { getDb } from '../../../services/firebase/config';
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';

const PlatformBuilder = ({
  isOpen,
  platform,
  platformForm,
  setPlatformForm,
  activePageBuilderTab,
  setActivePageBuilderTab,
  selectedPage,
  setSelectedPage,
  selectedSection,
  setSelectedSection,
  showLivePreview,
  setShowLivePreview,
  onSave,
  onCancel,
  companies = []
}) => {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isLoadingPlatformData, setIsLoadingPlatformData] = useState(false);
  const [platformData, setPlatformData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [rebuttals, setRebuttals] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [customerServiceTopics, setCustomerServiceTopics] = useState([]);
  const [editableContent, setEditableContent] = useState({});

  if (!isOpen) return null;

  // Fetch all platform-related data when platform changes
  useEffect(() => {
    if (platform && platform.companyId && companies.length > 0) {
      setIsLoadingCompany(true);
      setIsLoadingPlatformData(true);
      
      const company = companies.find(c => c.id === platform.companyId);
      if (company) {
        setCompanyInfo(company);
        // Generate preview URL - go directly to training page for Long Home Products
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const slugOrId = company.slug || company.id;
        
        // For Long Home Products, go directly to app (HomePage component)
        if (slugOrId === 'long-home') {
          setPreviewUrl(`${origin}/app`);
        } else {
          setPreviewUrl(`${origin}/company/${slugOrId}`);
        }
      }
      
      // Fetch all platform-related data
      fetchPlatformData(platform.companyId);
      setIsLoadingCompany(false);
    }
  }, [platform, companies]);

  const fetchPlatformData = async (companyId) => {
    try {
      const db = getDb();
      
      // Fetch all related data in parallel
      const [
        categoriesSnapshot,
        rebuttalsSnapshot,
        faqsSnapshot,
        customerServiceSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'rebuttals')),
        getDocs(collection(db, 'faqs')),
        getDocs(collection(db, 'serviceTopics'))
      ]);

      // Process categories
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      // Process rebuttals
      const rebuttalsData = rebuttalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRebuttals(rebuttalsData);

      // Process FAQs
      const faqsData = faqsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFaqs(faqsData);

      // Process customer service topics
      const customerServiceData = customerServiceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomerServiceTopics(customerServiceData);

      // Initialize editable content with real data
      setEditableContent({
        heroTitle: 'Long Home Products Training Platform',
        heroSubtitle: 'Master your sales skills with our comprehensive training programs',
        categories: categoriesData.slice(0, 8),
        rebuttals: rebuttalsData.slice(0, 4),
        faqs: faqsData.slice(0, 3),
        topics: customerServiceData.slice(0, 4)
      });

      // Update platform form with real data based on actual site structure
      const enhancedPlatformForm = {
        ...platformForm,
        pages: {
          // Dashboard page (main training interface)
          dashboard: {
            title: 'Dashboard',
            slug: 'dashboard',
            layout: 'training',
            content: {
              hero: {
                title: 'Long Home Products Training Dashboard',
                subtitle: 'Welcome to your sales training platform',
                backgroundImage: '',
                ctaText: 'Start Training',
                ctaLink: '/training'
              },
              sections: [
                {
                  type: 'sidebar',
                  title: 'Navigation Sidebar',
                  content: [
                    { icon: '📊', label: 'Dashboard', active: true },
                    { icon: '🎯', label: 'Rebuttals', active: false },
                    { icon: '❓', label: 'FAQ', active: false },
                    { icon: '📈', label: 'Progress', active: false }
                  ],
                  description: 'Main navigation sidebar'
                },
                {
                  type: 'stats',
                  title: 'Training Statistics',
                  content: [
                    { label: 'Rebuttals Mastered', value: '24', icon: '🎯' },
                    { label: 'Training Hours', value: '12.5', icon: '⏱️' },
                    { label: 'Progress Score', value: '85%', icon: '📊' }
                  ],
                  description: 'Your training progress overview'
                }
              ]
            }
          },
          // Rebuttals page (main rebuttal library)
          rebuttals: {
            title: 'Rebuttal Library',
            slug: 'rebuttals',
            layout: 'rebuttals',
            content: {
              hero: {
                title: 'Call Center Rebuttals',
                subtitle: 'Master effective responses to common objections',
                backgroundImage: '',
                ctaText: 'Browse Categories',
                ctaLink: '/rebuttals'
              },
              sections: [
                {
                  type: 'sidebar',
                  title: 'Category Sidebar',
                  content: categoriesData,
                  description: 'Browse rebuttals by category'
                },
                {
                  type: 'rebuttals',
                  title: 'Featured Rebuttals',
                  content: rebuttalsData.slice(0, 6),
                  description: 'Essential rebuttals for home improvement sales'
                }
              ]
            }
          },
          // FAQ page
          faq: {
            title: 'Frequently Asked Questions',
            slug: 'faq',
            layout: 'faq',
            content: {
              hero: {
                title: 'Frequently Asked Questions',
                subtitle: 'Find answers to common questions about our training platform and sales techniques',
                backgroundImage: '',
                ctaText: 'Browse All FAQs',
                ctaLink: '/faq'
              },
              sections: [
                {
                  type: 'faqs',
                  title: 'All Questions',
                  content: faqsData,
                  description: 'Complete FAQ library'
                }
              ]
            }
          },
          // Customer Service page
          customerService: {
            title: 'Customer Service Training',
            slug: 'customer-service',
            layout: 'customer-service',
            content: {
              hero: {
                title: 'Customer Service Excellence',
                subtitle: 'Learn effective customer service techniques for home improvement professionals',
                backgroundImage: '',
                ctaText: 'Start Training',
                ctaLink: '/customer-service'
              },
              sections: [
                {
                  type: 'topics',
                  title: 'Training Topics',
                  content: customerServiceData,
                  description: 'Customer service training modules'
                }
              ]
            }
          }
        }
      };

      setPlatformForm(enhancedPlatformForm);
      setPlatformData(enhancedPlatformForm);
      setIsLoadingPlatformData(false);
      
    } catch (error) {
      console.error('Error fetching platform data:', error);
      setIsLoadingPlatformData(false);
    }
  };

  // Handle real-time content updates
  const handleContentUpdate = (field, value) => {
    setEditableContent(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update the iframe content in real-time
    const iframe = document.querySelector('.real-site-iframe');
    if (iframe && iframe.contentWindow) {
      try {
        // Send message to iframe to update content
        iframe.contentWindow.postMessage({
          type: 'UPDATE_CONTENT',
          field,
          value
        }, '*');
      } catch (error) {
        console.log('Could not update iframe content:', error);
      }
    }
  };

  // Handle inline editing
  const handleInlineEdit = (field, value) => {
    handleContentUpdate(field, value);
  };

  // Save changes to database
  const saveChangesToDatabase = async () => {
    try {
      const db = getDb();
      
      // Save hero content to a company settings document
      const companyRef = doc(db, 'companies', platform.companyId);
      await updateDoc(companyRef, {
        heroTitle: editableContent.heroTitle,
        heroSubtitle: editableContent.heroSubtitle,
        lastUpdated: new Date()
      });
      
      console.log('✅ Changes saved to database');
    } catch (error) {
      console.error('❌ Error saving changes:', error);
    }
  };

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'IFRAME_READY') {
        console.log('✅ Iframe is ready for content updates');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleInputChange = (path, value) => {
    const keys = path.split('.');
    const newForm = { ...platformForm };
    let current = newForm;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setPlatformForm(newForm);
  };

  const addNewPage = () => {
    const pageId = `page_${Date.now()}`;
    const newPage = {
      title: 'New Page',
      slug: pageId,
      layout: 'default',
      content: {
        hero: {
          title: 'New Page Title',
          subtitle: 'New page content',
          backgroundImage: '',
          ctaText: 'Get Started',
          ctaLink: '/'
        },
        sections: []
      }
    };
    
    setPlatformForm({
      ...platformForm,
      pages: {
        ...platformForm.pages,
        [pageId]: newPage
      }
    });
  };

  const deletePage = (pageId) => {
    const newPages = { ...platformForm.pages };
    delete newPages[pageId];
    setPlatformForm({
      ...platformForm,
      pages: newPages
    });
    
    if (selectedPage === pageId) {
      setSelectedPage(Object.keys(newPages)[0] || 'home');
    }
  };

  const renderPagesTab = () => (
    <div className="builder-panel">
      <h3>📄 Page Management</h3>
      
      {isLoadingPlatformData ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading platform content...</p>
        </div>
      ) : (
        <>
      <div className="page-list">
        {Object.entries(platformForm.pages || {}).map(([pageKey, page]) => (
          <div 
            key={pageKey}
            className={`page-item ${selectedPage === pageKey ? 'active' : ''}`}
            onClick={() => setSelectedPage(pageKey)}
          >
            <span className="page-icon">📄</span>
            <div className="page-info">
                  <div className="page-title">
                    {page.title}
                    {page.content?.sections && (
                      <span className="sections-count">
                        ({page.content.sections.length} sections)
                      </span>
                    )}
                  </div>
              <div className="page-slug">/{page.slug}</div>
                  {page.content?.sections && page.content.sections.length > 0 && (
                    <div className="page-sections">
                      {page.content.sections.map((section, index) => (
                        <span key={index} className="section-tag">
                          {section.type}
                        </span>
                      ))}
                    </div>
                  )}
            </div>
            <div className="page-actions">
              <button 
                className="page-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage(pageKey);
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        <button className="add-page-btn" onClick={addNewPage}>
          ➕ Add Page
        </button>
      </div>
          
          {/* Data Summary */}
          <div className="data-summary">
            <h4>📊 Content Summary</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-icon">📄</span>
                <span className="summary-label">Pages</span>
                <span className="summary-value">{Object.keys(platformForm.pages || {}).length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">💬</span>
                <span className="summary-label">Rebuttals</span>
                <span className="summary-value">{rebuttals.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">📋</span>
                <span className="summary-label">Categories</span>
                <span className="summary-value">{categories.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">❓</span>
                <span className="summary-label">FAQs</span>
                <span className="summary-value">{faqs.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">🎧</span>
                <span className="summary-label">Service Topics</span>
                <span className="summary-value">{customerServiceTopics.length}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderNavigationTab = () => (
    <div className="builder-panel">
      <h3>🧭 Navigation</h3>
      <div className="form-group">
        <label>Main Navigation</label>
        <div className="navigation-items">
          {(platformForm.navigation?.main || []).map((item, index) => (
            <div key={index} className="navigation-item">
              <input
                type="text"
                value={item.label}
                onChange={(e) => {
                  const newNav = [...(platformForm.navigation?.main || [])];
                  newNav[index].label = e.target.value;
                  handleInputChange('navigation.main', newNav);
                }}
                placeholder="Label"
              />
              <input
                type="text"
                value={item.url}
                onChange={(e) => {
                  const newNav = [...(platformForm.navigation?.main || [])];
                  newNav[index].url = e.target.value;
                  handleInputChange('navigation.main', newNav);
                }}
                placeholder="URL"
              />
              <input
                type="text"
                value={item.icon}
                onChange={(e) => {
                  const newNav = [...(platformForm.navigation?.main || [])];
                  newNav[index].icon = e.target.value;
                  handleInputChange('navigation.main', newNav);
                }}
                placeholder="Icon"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBrandingTab = () => (
    <div className="builder-panel">
      <h3>🎨 Branding</h3>
      <div className="form-group">
        <label>Primary Color</label>
        <input
          type="color"
          value={platformForm.branding?.primaryColor || '#3B82F6'}
          onChange={(e) => handleInputChange('branding.primaryColor', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Secondary Color</label>
        <input
          type="color"
          value={platformForm.branding?.secondaryColor || '#1E40AF'}
          onChange={(e) => handleInputChange('branding.secondaryColor', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Accent Color</label>
        <input
          type="color"
          value={platformForm.branding?.accentColor || '#F59E0B'}
          onChange={(e) => handleInputChange('branding.accentColor', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Font Family</label>
        <select
          value={platformForm.branding?.fontFamily || 'Inter'}
          onChange={(e) => handleInputChange('branding.fontFamily', e.target.value)}
        >
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
          <option value="Open Sans">Open Sans</option>
          <option value="Lato">Lato</option>
        </select>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="builder-panel">
      <h3>⚙️ Settings</h3>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={platformForm.settings?.allowRegistration !== false}
            onChange={(e) => handleInputChange('settings.allowRegistration', e.target.checked)}
          />
          Allow Registration
        </label>
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={platformForm.settings?.requireEmailVerification || false}
            onChange={(e) => handleInputChange('settings.requireEmailVerification', e.target.checked)}
          />
          Require Email Verification
        </label>
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={platformForm.settings?.enableNotifications !== false}
            onChange={(e) => handleInputChange('settings.enableNotifications', e.target.checked)}
          />
          Enable Notifications
        </label>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (showLivePreview) {
      return (
        <div className="preview-frame">
          <div className="preview-content">
            <div className="preview-nav">
              {(platformForm.navigation?.main || []).map((item, index) => (
                <a key={index} href="#" className="preview-nav-item">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
            <div className="preview-page">
              <h1>{platformForm.pages?.[selectedPage]?.content?.hero?.title || 'Page Title'}</h1>
              <p>{platformForm.pages?.[selectedPage]?.content?.hero?.subtitle || 'Page content goes here...'}</p>
            </div>
          </div>
        </div>
      );
    }

    const currentPage = platformForm.pages?.[selectedPage];
    if (!currentPage) return <div>No page selected</div>;

    return (
      <div className="page-editor">
        <div className="page-editor-header">
          <h3>Edit: {currentPage.title}</h3>
          <div className="page-stats">
            <span className="stat-item">
              <span className="stat-icon">📄</span>
              {currentPage.content?.sections?.length || 0} sections
            </span>
            <span className="stat-item">
              <span className="stat-icon">📝</span>
              {currentPage.content?.sections?.reduce((total, section) => 
                total + (section.content?.length || 0), 0) || 0} items
            </span>
          </div>
        </div>
        
        <div className="page-editor-content">
          <div className="form-group">
            <label>Page Title</label>
            <input
              type="text"
              value={currentPage.title}
              onChange={(e) => handleInputChange(`pages.${selectedPage}.title`, e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Page Slug</label>
            <input
              type="text"
              value={currentPage.slug}
              onChange={(e) => handleInputChange(`pages.${selectedPage}.slug`, e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Hero Title</label>
            <input
              type="text"
              value={currentPage.content?.hero?.title || ''}
              onChange={(e) => handleInputChange(`pages.${selectedPage}.content.hero.title`, e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Hero Subtitle</label>
            <textarea
              value={currentPage.content?.hero?.subtitle || ''}
              onChange={(e) => handleInputChange(`pages.${selectedPage}.content.hero.subtitle`, e.target.value)}
              rows="3"
            />
          </div>
          
          {/* Sections Editor */}
          {currentPage.content?.sections && currentPage.content.sections.length > 0 && (
            <div className="sections-editor">
              <div className="sections-header">
                <h4>📋 Page Sections</h4>
                <button 
                  className="add-section-btn"
                  onClick={() => {
                    const newSection = {
                      type: 'content',
                      title: 'New Section',
                      content: 'Section content',
                      description: 'Section description'
                    };
                    const currentSections = currentPage.content.sections || [];
                    handleInputChange(`pages.${selectedPage}.content.sections`, [...currentSections, newSection]);
                  }}
                >
                  ➕ Add Section
                </button>
              </div>
              
              <div className="sections-list">
                {currentPage.content.sections.map((section, index) => (
                  <div key={index} className="section-item">
                    <div className="section-header">
                      <div className="section-info">
                        <span className="section-type">{section.type}</span>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => {
                            const newSections = [...currentPage.content.sections];
                            newSections[index].title = e.target.value;
                            handleInputChange(`pages.${selectedPage}.content.sections`, newSections);
                          }}
                          className="section-title-input"
                        />
                      </div>
                      <div className="section-actions">
                        <button 
                          className="section-action-btn"
                          onClick={() => {
                            const newSections = currentPage.content.sections.filter((_, i) => i !== index);
                            handleInputChange(`pages.${selectedPage}.content.sections`, newSections);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="section-content">
                      <div className="form-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={section.description || ''}
                          onChange={(e) => {
                            const newSections = [...currentPage.content.sections];
                            newSections[index].description = e.target.value;
                            handleInputChange(`pages.${selectedPage}.content.sections`, newSections);
                          }}
                        />
                      </div>
                      
                      {section.content && Array.isArray(section.content) && (
                        <div className="content-items">
                          <label>Content Items ({section.content.length})</label>
                          <div className="content-preview">
                            {section.content.slice(0, 3).map((item, itemIndex) => (
                              <div key={itemIndex} className="content-item-preview">
                                <span className="item-icon">
                                  {item.icon || '📄'}
                                </span>
                                <span className="item-title">
                                  {item.title || item.name || `Item ${itemIndex + 1}`}
                                </span>
                              </div>
                            ))}
                            {section.content.length > 3 && (
                              <div className="more-items">
                                +{section.content.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="new-modal-overlay">
      <div className="platform-builder-container">
        <div className="platform-builder-header">
          <div className="platform-builder-title">
            <span className="platform-builder-icon">🎯</span>
            <div className="title-content">
            <h2>Platform Page Builder</h2>
            <span className="platform-builder-subtitle">Edit {platformForm.name} - Visual Page Editor</span>
              {companyInfo && (
                <div className="company-info-header">
                  <div className="company-badge">
                    <span className="company-icon">🏢</span>
                    <span className="company-name">{companyInfo.name}</span>
                    <span className={`company-status ${companyInfo.status}`}>{companyInfo.status}</span>
                  </div>
                  <div className="company-details-mini">
                    <span className="company-email">📧 {companyInfo.email}</span>
                    <span className="company-industry">🏭 {companyInfo.industry}</span>
                    <span className="company-plan">💎 {companyInfo.plan}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="platform-builder-actions">
            {previewUrl && (
            <button 
              className="preview-btn"
              onClick={() => setShowLivePreview(!showLivePreview)}
            >
              {showLivePreview ? '📝 Edit Mode' : '👁️ Live Preview'}
            </button>
            )}
            <button className="new-modal-close" onClick={onCancel}>×</button>
          </div>
        </div>
        
        <div className="platform-builder-body">
          <div className="platform-builder-sidebar">
            <div className="builder-tabs">
              <button 
                className={`builder-tab ${activePageBuilderTab === 'pages' ? 'active' : ''}`}
                onClick={() => setActivePageBuilderTab('pages')}
              >
                📄 Pages
              </button>
              <button 
                className={`builder-tab ${activePageBuilderTab === 'navigation' ? 'active' : ''}`}
                onClick={() => setActivePageBuilderTab('navigation')}
              >
                🧭 Navigation
              </button>
              <button 
                className={`builder-tab ${activePageBuilderTab === 'branding' ? 'active' : ''}`}
                onClick={() => setActivePageBuilderTab('branding')}
              >
                🎨 Branding
              </button>
              <button 
                className={`builder-tab ${activePageBuilderTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActivePageBuilderTab('settings')}
              >
                ⚙️ Settings
              </button>
            </div>

            {activePageBuilderTab === 'pages' && renderPagesTab()}
            {activePageBuilderTab === 'navigation' && renderNavigationTab()}
            {activePageBuilderTab === 'branding' && renderBrandingTab()}
            {activePageBuilderTab === 'settings' && renderSettingsTab()}
          </div>

          <div className="platform-builder-main">
            <div className="wordpress-style-editor">
              {/* WordPress-style Toolbar */}
              <div className="wp-toolbar">
                <div className="toolbar-left">
                  <button 
                    className={`toolbar-btn ${!showLivePreview ? 'active' : ''}`}
                    onClick={() => setShowLivePreview(false)}
                  >
                    <span className="btn-icon">✏️</span>
                    <span className="btn-label">Edit</span>
                  </button>
                  <button 
                    className={`toolbar-btn ${showLivePreview ? 'active' : ''}`}
                    onClick={() => setShowLivePreview(true)}
                  >
                    <span className="btn-icon">👁️</span>
                    <span className="btn-label">Preview</span>
                  </button>
                </div>
                
                <div className="toolbar-center">
                  <div className="page-selector">
                    <select 
                      value={selectedPage} 
                      onChange={(e) => setSelectedPage(e.target.value)}
                      className="page-select"
                    >
                      {Object.entries(platformForm.pages || {}).map(([pageKey, page]) => (
                        <option key={pageKey} value={pageKey}>
                          {page.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="toolbar-right">
                  <button 
                    className="toolbar-btn secondary"
                    onClick={saveChangesToDatabase}
                  >
                    <span className="btn-icon">💾</span>
                    <span className="btn-label">Save Draft</span>
                  </button>
                  <button 
                    className="toolbar-btn primary" 
                    onClick={async () => {
                      await saveChangesToDatabase();
                      onSave();
                    }}
                  >
                    <span className="btn-icon">🚀</span>
                    <span className="btn-label">Publish</span>
                  </button>
                  <button 
                    className="toolbar-btn"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                  >
                    <span className="btn-icon">{showLivePreview ? '📝' : '👁️'}</span>
                    <span className="btn-label">{showLivePreview ? 'Edit Mode' : 'Live Preview'}</span>
                  </button>
                </div>
              </div>

              {/* WordPress-style Content Area */}
              <div className="wp-content-area">
                {showLivePreview ? (
                  <div className="real-site-preview">
                    <div className="preview-header">
                      <div className="preview-info">
                        <span className="preview-label">🏠 Long Home Products Training Platform</span>
                        <span className="preview-url-text">{previewUrl}</span>
                      </div>
                      <div className="preview-controls">
                        <button 
                          className="preview-control-btn"
                          onClick={() => setShowLivePreview(false)}
                        >
                          📝 Edit Mode
                        </button>
                        <button 
                          className="copy-url-btn"
                          onClick={() => navigator.clipboard.writeText(previewUrl)}
                        >
                          📋 Copy URL
                        </button>
                      </div>
                    </div>
                    <div className="real-site-iframe-container">
                      <iframe
                        src={previewUrl}
                        className="real-site-iframe"
                        title="Long Home Products Real Site"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="wp-editor-container">
                    <div className="wp-editor-sidebar">
                      <div className="editor-panel">
                        <h4>📄 Page Settings</h4>
                        <div className="form-group">
                          <label>Page Title</label>
                          <input
                            type="text"
                            value={platformForm.pages?.[selectedPage]?.title || ''}
                            onChange={(e) => handleInputChange(`pages.${selectedPage}.title`, e.target.value)}
                            className="wp-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Page Slug</label>
                          <input
                            type="text"
                            value={platformForm.pages?.[selectedPage]?.slug || ''}
                            onChange={(e) => handleInputChange(`pages.${selectedPage}.slug`, e.target.value)}
                            className="wp-input"
                          />
                        </div>
                      </div>

                      <div className="editor-panel">
                        <h4>🎨 Hero Section</h4>
                        <div className="form-group">
                          <label>Hero Title</label>
                          <input
                            type="text"
                            value={editableContent.heroTitle || ''}
                            onChange={(e) => handleContentUpdate('heroTitle', e.target.value)}
                            className="wp-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Hero Subtitle</label>
                          <textarea
                            value={editableContent.heroSubtitle || ''}
                            onChange={(e) => handleContentUpdate('heroSubtitle', e.target.value)}
                            rows="3"
                            className="wp-textarea"
                          />
                        </div>
                      </div>

                      <div className="editor-panel">
                        <h4>📋 Content Sections</h4>
                        <div className="sections-list">
                          {platformForm.pages?.[selectedPage]?.content?.sections?.map((section, index) => (
                            <div key={index} className="section-item">
                              <div className="section-header">
                                <span className="section-type">{section.type}</span>
                                <span className="section-title">{section.title}</span>
                              </div>
                              <div className="section-actions">
                                <button 
                                  className="section-btn edit"
                                  onClick={() => setSelectedSection(index)}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="section-btn delete"
                                  onClick={() => {
                                    const newSections = platformForm.pages[selectedPage].content.sections.filter((_, i) => i !== index);
                                    handleInputChange(`pages.${selectedPage}.content.sections`, newSections);
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button 
                          className="add-section-btn"
                          onClick={() => {
                            const newSection = {
                              type: 'content',
                              title: 'New Section',
                              content: 'Section content',
                              description: 'Section description'
                            };
                            const currentSections = platformForm.pages[selectedPage]?.content?.sections || [];
                            handleInputChange(`pages.${selectedPage}.content.sections`, [...currentSections, newSection]);
                          }}
                        >
                          ➕ Add Section
                        </button>
                      </div>
                    </div>

                    <div className="wp-editor-main">
                      <div className="wp-canvas">
                        <div className="page-preview">
                          <div className="page-header">
                            <h1 
                              className="editable-title" 
                              contentEditable="true"
                              onBlur={(e) => handleInlineEdit('heroTitle', e.target.textContent)}
                              suppressContentEditableWarning={true}
                            >
                              {editableContent.heroTitle || 'Long Home Products Training Platform'}
                            </h1>
                            <p 
                              className="editable-subtitle" 
                              contentEditable="true"
                              onBlur={(e) => handleInlineEdit('heroSubtitle', e.target.textContent)}
                              suppressContentEditableWarning={true}
                            >
                              {editableContent.heroSubtitle || 'Master your sales skills with our comprehensive training programs'}
                            </p>
                          </div>
                          
                          <div className="page-content">
                            {platformForm.pages?.[selectedPage]?.content?.sections?.map((section, index) => (
                              <div key={index} className="content-section">
                                <div className="section-header">
                                  <h3 className="editable-section-title" contentEditable="true">
                                    {section.title}
                                  </h3>
                                  <div className="section-controls">
                                    <button className="section-control-btn">⚙️</button>
                                    <button className="section-control-btn">📋</button>
                                    <button className="section-control-btn">🗑️</button>
                                  </div>
                                </div>
                                
                                <div className="section-content">
                                  {section.type === 'sidebar' && section.content && (
                                    <div className="sidebar-preview">
                                      <div className="sidebar-nav">
                                        {section.content.map((item, itemIndex) => (
                                          <div key={itemIndex} className={`sidebar-item ${item.active ? 'active' : ''}`}>
                                            <span className="sidebar-icon">{item.icon}</span>
                                            <span className="sidebar-label">{item.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {section.type === 'stats' && section.content && (
                                    <div className="stats-grid">
                                      {section.content.map((stat, statIndex) => (
                                        <div key={statIndex} className="stat-card">
                                          <div className="stat-icon">{stat.icon}</div>
                                          <div className="stat-info">
                                            <div className="stat-value">{stat.value}</div>
                                            <div className="stat-label">{stat.label}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {section.type === 'features' && section.content && (
                                    <div className="features-grid">
                                      {section.content.map((feature, featureIndex) => (
                                        <div key={featureIndex} className="feature-card">
                                          <div className="feature-icon">{feature.icon}</div>
                                          <h4 className="feature-title">{feature.title}</h4>
                                          <p className="feature-description">{feature.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {section.type === 'categories' && (
                                    <div className="categories-grid">
                                      {(editableContent.categories || []).slice(0, 6).map((category, catIndex) => (
                                        <div key={catIndex} className="category-card">
                                          <span className="category-icon">{category.icon || '📁'}</span>
                                          <span className="category-name">{category.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {section.type === 'rebuttals' && (
                                    <div className="rebuttals-list">
                                      {(editableContent.rebuttals || []).slice(0, 4).map((rebuttal, rebIndex) => (
                                        <div key={rebIndex} className="rebuttal-card">
                                          <h4>{rebuttal.title}</h4>
                                          <p>{rebuttal.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {section.type === 'faqs' && (
                                    <div className="faqs-list">
                                      {(editableContent.faqs || []).slice(0, 3).map((faq, faqIndex) => (
                                        <div key={faqIndex} className="faq-item">
                                          <h4>{faq.question}</h4>
                                          <p>{faq.answer}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {section.type === 'topics' && (
                                    <div className="topics-list">
                                      {(editableContent.topics || []).slice(0, 4).map((topic, topicIndex) => (
                                        <div key={topicIndex} className="topic-card">
                                          <h4>{topic.title}</h4>
                                          <p>{topic.description}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default PlatformBuilder;