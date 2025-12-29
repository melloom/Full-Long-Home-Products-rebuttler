import React, { useState, useEffect } from 'react';
import { getDb } from '../../../../services/firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { generatePlatformForm } from '../../../../utils/saasAdminUtils';
import './CreatePlatformModal.css';

const CreatePlatformModal = ({ isOpen, onClose, onSuccess, companies = [] }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [previewWindow, setPreviewWindow] = useState(null);
  const [formData, setFormData] = useState({
    // Step 1: Company Selection
    companyId: '',
    companyName: '',
    
    // Step 2: Platform Details
    platformName: '',
    platformSlug: '',
    description: '',
    industry: '',
    
    // Step 3: Branding & Design
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    accentColor: '#10b981',
    logo: '',
    favicon: '',
    fontFamily: 'Inter',
    layout: 'modern',
    
    // Step 4: Template Selection
    template: 'training',
    selectedFeatures: [],
    
    // Step 5: Page Builder
    pages: [
      {
        id: 'home',
        name: 'Home',
        slug: 'home',
        type: 'home',
        template: 'hero-with-features',
        content: {
          hero: {
            title: 'Welcome to Your Training Platform',
            subtitle: 'Master your skills with our comprehensive training programs',
            backgroundImage: '',
            ctaText: 'Get Started',
            ctaLink: '/training'
          },
          features: [
            { title: 'Interactive Courses', description: 'Engaging learning experiences', icon: '🎓' },
            { title: 'Progress Tracking', description: 'Monitor your learning journey', icon: '📊' },
            { title: 'Expert Instructors', description: 'Learn from industry professionals', icon: '👨‍🏫' }
          ]
        }
      },
      {
        id: 'training',
        name: 'Training',
        slug: 'training',
        type: 'training',
        template: 'course-grid',
        content: {
          title: 'Training Programs',
          description: 'Choose from our comprehensive training programs',
          courses: []
        }
      },
      {
        id: 'courses',
        name: 'Courses',
        slug: 'courses',
        type: 'courses',
        template: 'course-listing',
        content: {
          title: 'All Courses',
          description: 'Browse our complete course catalog',
          categories: []
        }
      },
      {
        id: 'about',
        name: 'About',
        slug: 'about',
        type: 'about',
        template: 'about-page',
        content: {
          title: 'About Us',
          description: 'Learn more about our training platform',
          team: [],
          mission: ''
        }
      }
    ],
    
    // Step 6: Content Setup
    heroTitle: '',
    heroSubtitle: '',
    categories: [],
    rebuttals: [],
    faqs: [],
    
    // Step 7: Advanced Features
    features: {
      userRegistration: true,
      progressTracking: true,
      certificates: true,
      discussionForums: false,
      liveChat: false,
      mobileApp: false,
      analytics: true,
      customDomain: false
    },
    
    // Step 8: Settings
    isPublic: true,
    allowRegistration: true,
    requireApproval: false,
    maxUsers: 100,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const totalSteps = 8;

  const templates = [
    {
      id: 'training',
      name: 'Training Platform',
      description: 'Complete training platform with courses, assessments, and progress tracking',
      icon: '🎓',
      features: ['Courses', 'Assessments', 'Progress Tracking', 'Certificates', 'Discussion Forums']
    },
    {
      id: 'sales',
      name: 'Sales Training',
      description: 'Sales-focused training with scripts, rebuttals, and role-playing',
      icon: '💼',
      features: ['Sales Scripts', 'Rebuttals', 'Role Playing', 'Performance Metrics', 'Leaderboards']
    },
    {
      id: 'onboarding',
      name: 'Employee Onboarding',
      description: 'Structured onboarding program for new employees',
      icon: '👥',
      features: ['Welcome Modules', 'Company Policies', 'Team Introductions', 'Checklists', 'Feedback Forms']
    },
    {
      id: 'compliance',
      name: 'Compliance Training',
      description: 'Compliance and regulatory training platform',
      icon: '📋',
      features: ['Compliance Modules', 'Certifications', 'Audit Trails', 'Reporting', 'Renewal Tracking']
    }
  ];

  const industries = [
    'Home Improvement',
    'Real Estate',
    'Insurance',
    'Financial Services',
    'Healthcare',
    'Technology',
    'Retail',
    'Manufacturing',
    'Education',
    'Other'
  ];

  const defaultFeatures = [
    'User Management',
    'Content Library',
    'Progress Tracking',
    'Analytics Dashboard',
    'Mobile Responsive',
    'Custom Branding',
    'Email Notifications',
    'API Access'
  ];

  const pageTemplates = [
    {
      id: 'hero-with-features',
      name: 'Hero with Features',
      description: 'Landing page with hero section and feature highlights',
      icon: '🏠',
      preview: 'hero-features-preview'
    },
    {
      id: 'course-grid',
      name: 'Course Grid',
      description: 'Grid layout for displaying courses and programs',
      icon: '📚',
      preview: 'course-grid-preview'
    },
    {
      id: 'course-listing',
      name: 'Course Listing',
      description: 'List view for courses with filters and search',
      icon: '📋',
      preview: 'course-listing-preview'
    },
    {
      id: 'about-page',
      name: 'About Page',
      description: 'About page with team, mission, and company info',
      icon: '👥',
      preview: 'about-page-preview'
    },
    {
      id: 'contact-page',
      name: 'Contact Page',
      description: 'Contact form and company information',
      icon: '📞',
      preview: 'contact-page-preview'
    },
    {
      id: 'blog-page',
      name: 'Blog Page',
      description: 'Blog listing with articles and posts',
      icon: '📝',
      preview: 'blog-page-preview'
    }
  ];

  const contentBlocks = [
    {
      id: 'hero',
      name: 'Hero Section',
      description: 'Main banner with title, subtitle, and CTA',
      icon: '🎯',
      category: 'layout'
    },
    {
      id: 'features',
      name: 'Features Grid',
      description: 'Grid of features with icons and descriptions',
      icon: '⭐',
      category: 'content'
    },
    {
      id: 'courses',
      name: 'Course Grid',
      description: 'Display courses in a grid layout',
      icon: '📚',
      category: 'content'
    },
    {
      id: 'testimonials',
      name: 'Testimonials',
      description: 'Customer testimonials and reviews',
      icon: '💬',
      category: 'social'
    },
    {
      id: 'team',
      name: 'Team Section',
      description: 'Team members with photos and bios',
      icon: '👥',
      category: 'content'
    },
    {
      id: 'contact-form',
      name: 'Contact Form',
      description: 'Contact form with fields and validation',
      icon: '📧',
      category: 'forms'
    },
    {
      id: 'faq',
      name: 'FAQ Section',
      description: 'Frequently asked questions with answers',
      icon: '❓',
      category: 'content'
    },
    {
      id: 'pricing',
      name: 'Pricing Table',
      description: 'Pricing plans and packages',
      icon: '💰',
      category: 'commerce'
    }
  ];

  const fontFamilies = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Source Sans Pro', value: 'Source Sans Pro' },
    { name: 'Nunito', value: 'Nunito' }
  ];

  const layouts = [
    { name: 'Modern', value: 'modern', description: 'Clean, modern design with lots of white space' },
    { name: 'Classic', value: 'classic', description: 'Traditional business layout' },
    { name: 'Creative', value: 'creative', description: 'Bold, creative design with unique elements' },
    { name: 'Minimal', value: 'minimal', description: 'Minimalist design focusing on content' }
  ];

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      // Only reset when modal is first opened
      setCurrentStep(1);
      setFormData({
        companyId: '',
        companyName: '',
        platformName: '',
        platformSlug: '',
        description: '',
        industry: '',
        primaryColor: '#1e40af',
        secondaryColor: '#3b82f6',
        accentColor: '#10b981',
        logo: '',
        favicon: '',
        fontFamily: 'Inter',
        layout: 'modern',
        template: 'training',
        selectedFeatures: defaultFeatures,
        pages: [
          {
            id: 'home',
            name: 'Home',
            slug: 'home',
            type: 'home',
            template: 'hero-with-features',
            content: {
              hero: {
                title: 'Welcome to Your Training Platform',
                subtitle: 'Master your skills with our comprehensive training programs',
                backgroundImage: '',
                ctaText: 'Get Started',
                ctaLink: '/training'
              },
              features: [
                { title: 'Interactive Courses', description: 'Engaging learning experiences', icon: '🎓' },
                { title: 'Progress Tracking', description: 'Monitor your learning journey', icon: '📊' },
                { title: 'Expert Instructors', description: 'Learn from industry professionals', icon: '👨‍🏫' }
              ]
            }
          },
          {
            id: 'training',
            name: 'Training',
            slug: 'training',
            type: 'training',
            template: 'course-grid',
            content: {
              title: 'Training Programs',
              description: 'Choose from our comprehensive training programs',
              courses: []
            }
          },
          {
            id: 'courses',
            name: 'Courses',
            slug: 'courses',
            type: 'courses',
            template: 'course-listing',
            content: {
              title: 'All Courses',
              description: 'Browse our complete course catalog',
              categories: []
            }
          },
          {
            id: 'about',
            name: 'About',
            slug: 'about',
            type: 'about',
            template: 'about-page',
            content: {
              title: 'About Us',
              description: 'Learn more about our training platform',
              team: [],
              mission: ''
            }
          }
        ],
        heroTitle: '',
        heroSubtitle: '',
        categories: [],
        rebuttals: [],
        faqs: [],
        features: {
          userRegistration: true,
          progressTracking: true,
          certificates: true,
          discussionForums: false,
          liveChat: false,
          mobileApp: false,
          analytics: true,
          customDomain: false
        },
        isPublic: true,
        allowRegistration: true,
        requireApproval: false,
        maxUsers: 100,
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: []
        }
      });
      setErrors({});
      setHasInitialized(true);
    } else if (!isOpen) {
      // Reset initialization flag when modal is closed
      setHasInitialized(false);
      // Close preview window if open
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
        setPreviewWindow(null);
      }
    }
  }, [isOpen, hasInitialized, previewWindow]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from platform name
    if (field === 'platformName') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        platformSlug: slug
      }));
    }

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Page Builder Helper Functions
  const getPageIcon = (type) => {
    const icons = {
      home: '🏠',
      training: '🎓',
      courses: '📚',
      about: '👥',
      contact: '📞',
      blog: '📝',
      faq: '❓',
      pricing: '💰'
    };
    return icons[type] || '📄';
  };

  const addNewPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: 'New Page',
      slug: 'new-page',
      type: 'content',
      template: 'hero-with-features',
      content: {
        hero: {
          title: 'New Page',
          subtitle: 'Add your content here',
          backgroundImage: '',
          ctaText: 'Learn More',
          ctaLink: '#'
        }
      }
    };
    
    setFormData(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
  };

  const editPage = (index) => {
    // This would open a page editor modal
    console.log('Edit page:', formData.pages[index]);
  };

  const deletePage = (index) => {
    setFormData(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index)
    }));
  };

  const getFeatureName = (key) => {
    const names = {
      userRegistration: 'User Registration',
      progressTracking: 'Progress Tracking',
      certificates: 'Certificates',
      discussionForums: 'Discussion Forums',
      liveChat: 'Live Chat',
      mobileApp: 'Mobile App',
      analytics: 'Analytics',
      customDomain: 'Custom Domain'
    };
    return names[key] || key;
  };

  const getFeatureDescription = (key) => {
    const descriptions = {
      userRegistration: 'Allow users to create accounts and register',
      progressTracking: 'Track user progress through courses and modules',
      certificates: 'Generate completion certificates for users',
      discussionForums: 'Enable community discussions and forums',
      liveChat: 'Real-time chat support for users',
      mobileApp: 'Native mobile app for iOS and Android',
      analytics: 'Detailed analytics and reporting dashboard',
      customDomain: 'Use your own custom domain name'
    };
    return descriptions[key] || 'Feature description';
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.companyId) newErrors.companyId = 'Please select a company';
        break;
      case 2:
        if (!formData.platformName) newErrors.platformName = 'Platform name is required';
        if (!formData.platformSlug) newErrors.platformSlug = 'Platform slug is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
        break;
      case 3:
        // Branding is optional, no validation needed
        break;
      case 4:
        if (!formData.template) newErrors.template = 'Please select a template';
        break;
      case 5:
        if (!formData.heroTitle) newErrors.heroTitle = 'Hero title is required';
        if (!formData.heroSubtitle) newErrors.heroSubtitle = 'Hero subtitle is required';
        break;
      case 6:
        // Settings have defaults, no validation needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePreview = () => {
    // Generate a preview slug if none exists
    const previewSlug = formData.platformSlug || 
      (formData.platformName ? formData.platformName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'preview-platform');
    
    // Generate the platform URL with live data
    const baseUrl = window.location.origin;
    const platformUrl = `${baseUrl}/company/${previewSlug}`;
    
    // Create a preview window with live data
    const newPreviewWindow = window.open(platformUrl, '_blank', 'noopener,noreferrer');
    setPreviewWindow(newPreviewWindow);
    
    // Send live data to the preview window when it loads
    if (newPreviewWindow) {
      newPreviewWindow.addEventListener('load', () => {
        sendLiveDataToPreview(newPreviewWindow);
      });
    }
  };

  const sendLiveDataToPreview = (window) => {
    if (!window || window.closed) return;
    
    // Generate a preview slug if none exists
    const previewSlug = formData.platformSlug || 
      (formData.platformName ? formData.platformName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'preview-platform');
    
    // Send current form data to the preview
    window.postMessage({
      type: 'LIVE_PREVIEW_DATA',
      data: {
        platformName: formData.platformName,
        platformSlug: previewSlug,
        description: formData.description,
        heroTitle: formData.heroTitle,
        heroSubtitle: formData.heroSubtitle,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        logo: formData.logo,
        favicon: formData.favicon,
        fontFamily: formData.fontFamily,
        template: formData.template,
        features: formData.features,
        pages: formData.pages,
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          logo: formData.logo,
          favicon: formData.favicon,
          fontFamily: formData.fontFamily
        }
      }
    }, '*');
  };

  // Send live updates to preview window when form data changes
  useEffect(() => {
    if (previewWindow && !previewWindow.closed) {
      // Debounce the updates to avoid too many messages
      const timeoutId = setTimeout(() => {
        sendLiveDataToPreview(previewWindow);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData, previewWindow]);

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      const db = getDb();
      
      // Convert features array to object with boolean values
      const featuresObject = {};
      if (Array.isArray(formData.features)) {
        formData.features.forEach(feature => {
          featuresObject[feature] = true;
        });
      } else if (typeof formData.features === 'object') {
        Object.assign(featuresObject, formData.features);
      }

      // Create platform document
      const platformData = {
        name: formData.platformName,
        slug: formData.platformSlug,
        description: formData.description,
        companyId: formData.companyId,
        industry: formData.industry,
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logo: formData.logo,
          favicon: formData.favicon
        },
        template: formData.template,
        features: featuresObject,
        content: {
          hero: {
            title: formData.heroTitle,
            subtitle: formData.heroSubtitle
          }
        },
        settings: {
          isPublic: formData.isPublic,
          allowRegistration: formData.allowRegistration,
          requireApproval: formData.requireApproval,
          maxUsers: formData.maxUsers
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const platformRef = await addDoc(collection(db, 'platforms'), platformData);
      
      // Generate initial platform form structure
      const initialForm = generatePlatformForm({
        ...platformData,
        id: platformRef.id
      });

      // Update platform with initial form structure
      await updateDoc(platformRef, {
        form: initialForm
      });

      // Update company with platform reference
      const companyRef = doc(db, 'companies', formData.companyId);
      await updateDoc(companyRef, {
        platformId: platformRef.id,
        updatedAt: new Date()
      });

      onSuccess({
        id: platformRef.id,
        ...platformData,
        form: initialForm
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating platform:', error);
      setErrors({ submit: 'Failed to create platform. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
  return (
          <div className="step-content">
            <div className="step-header">
              <h3>Select Company</h3>
              <p>Choose which company this platform will belong to</p>
              </div>
            <div className="form-group">
              <label>Company *</label>
              <select
                value={formData.companyId}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value);
                  handleInputChange('companyId', e.target.value);
                  handleInputChange('companyName', company?.name || '');
                }}
                className={`form-input ${errors.companyId ? 'error' : ''}`}
              >
                <option value="">Select a company...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.email})
                  </option>
                ))}
              </select>
              {errors.companyId && <span className="error-message">{errors.companyId}</span>}
          </div>
        </div>
        );

            case 2:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Platform Details</h3>
              <p>Configure the basic information and settings for your training platform</p>
        </div>

            <div className="details-section">
              <h4>Basic Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Platform Name *</label>
                  <input
                    type="text"
                    value={formData.platformName}
                    onChange={(e) => handleInputChange('platformName', e.target.value)}
                    className={`form-input ${errors.platformName ? 'error' : ''}`}
                    placeholder="e.g., Sales Training Academy"
                  />
                  <small className="form-help">This will be displayed as the main title of your platform</small>
                  {errors.platformName && <span className="error-message">{errors.platformName}</span>}
                </div>
                <div className="form-group">
                  <label>Platform Slug *</label>
                      <input
                        type="text"
                    value={formData.platformSlug}
                    onChange={(e) => handleInputChange('platformSlug', e.target.value)}
                    className={`form-input ${errors.platformSlug ? 'error' : ''}`}
                    placeholder="e.g., sales-training-academy"
                  />
                  <small className="form-help">Used in URLs: yoursite.com/{formData.platformSlug || 'platform-slug'}</small>
                  {errors.platformSlug && <span className="error-message">{errors.platformSlug}</span>}
                    </div>
                  </div>

              <div className="form-group">
                <label>Platform Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                  rows="4"
                  placeholder="Describe what this platform will be used for, who it's for, and what makes it special..."
                />
                <small className="form-help">This description will be used for SEO and platform overview</small>
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Industry *</label>
                      <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`form-input ${errors.industry ? 'error' : ''}`}
                  >
                    <option value="">Select industry...</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                  <small className="form-help">Helps customize templates and content</small>
                  {errors.industry && <span className="error-message">{errors.industry}</span>}
                </div>
                <div className="form-group">
                  <label>Platform Type</label>
                  <select
                    value={formData.platformType || 'training'}
                    onChange={(e) => handleInputChange('platformType', e.target.value)}
                    className="form-input"
                  >
                    <option value="training">Training Platform</option>
                    <option value="education">Educational Platform</option>
                    <option value="certification">Certification Platform</option>
                    <option value="onboarding">Employee Onboarding</option>
                    <option value="compliance">Compliance Training</option>
                    <option value="sales">Sales Training</option>
                    <option value="custom">Custom Platform</option>
                  </select>
                  <small className="form-help">Determines default features and templates</small>
                </div>
                    </div>
                  </div>

            <div className="details-section">
              <h4>Target Audience</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Primary Audience</label>
                  <select
                    value={formData.primaryAudience || 'employees'}
                    onChange={(e) => handleInputChange('primaryAudience', e.target.value)}
                    className="form-input"
                  >
                    <option value="employees">Company Employees</option>
                    <option value="customers">Customers</option>
                    <option value="partners">Business Partners</option>
                    <option value="students">Students</option>
                    <option value="public">General Public</option>
                    <option value="members">Members Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Skill Level</label>
                  <select
                    value={formData.skillLevel || 'beginner'}
                    onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                    className="form-input"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="mixed">Mixed Levels</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h4>Platform Goals</h4>
              <div className="goals-grid">
                {[
                  { id: 'skill-development', label: 'Skill Development', description: 'Help users develop new skills' },
                  { id: 'certification', label: 'Certification', description: 'Provide certification programs' },
                  { id: 'compliance', label: 'Compliance', description: 'Ensure regulatory compliance' },
                  { id: 'onboarding', label: 'Onboarding', description: 'New employee orientation' },
                  { id: 'performance', label: 'Performance', description: 'Improve job performance' },
                  { id: 'engagement', label: 'Engagement', description: 'Increase employee engagement' }
                ].map(goal => (
                  <label key={goal.id} className="goal-option">
                    <input
                      type="checkbox"
                      checked={formData.goals?.includes(goal.id) || false}
                      onChange={(e) => {
                        const currentGoals = formData.goals || [];
                        const newGoals = e.target.checked
                          ? [...currentGoals, goal.id]
                          : currentGoals.filter(g => g !== goal.id);
                        handleInputChange('goals', newGoals);
                      }}
                    />
                    <div className="goal-content">
                      <strong>{goal.label}</strong>
                      <small>{goal.description}</small>
                    </div>
                    </label>
                ))}
              </div>
            </div>
          </div>
        );

            case 3:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Branding & Design</h3>
              <p>Customize the visual identity and design system for your platform</p>
            </div>
            
            <div className="design-section">
              <h4>Color Scheme</h4>
              <div className="color-palette">
                <div className="form-row">
                  <div className="form-group">
                    <label>Primary Color</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="form-input color-text"
                      />
                    </div>
                    <small className="form-help">Main brand color for headers, buttons, and accents</small>
                  </div>
                  <div className="form-group">
                    <label>Secondary Color</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="form-input color-text"
                      />
                    </div>
                    <small className="form-help">Supporting color for backgrounds and secondary elements</small>
                  </div>
                  <div className="form-group">
                    <label>Accent Color</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="color-input"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => handleInputChange('accentColor', e.target.value)}
                        className="form-input color-text"
                      />
                    </div>
                    <small className="form-help">Highlight color for CTAs and important elements</small>
                    </div>
                  </div>

                <div className="color-presets">
                  <h5>Color Presets</h5>
                  <div className="preset-grid">
                    {[
                      { name: 'Professional Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#10b981' },
                      { name: 'Corporate Green', primary: '#059669', secondary: '#10b981', accent: '#f59e0b' },
                      { name: 'Modern Purple', primary: '#7c3aed', secondary: '#a855f7', accent: '#ec4899' },
                      { name: 'Warm Orange', primary: '#ea580c', secondary: '#f97316', accent: '#eab308' },
                      { name: 'Cool Gray', primary: '#374151', secondary: '#6b7280', accent: '#3b82f6' },
                      { name: 'Bold Red', primary: '#dc2626', secondary: '#ef4444', accent: '#f59e0b' }
                    ].map(preset => (
                      <div
                        key={preset.name}
                        className="preset-option"
                        onClick={() => {
                          handleInputChange('primaryColor', preset.primary);
                          handleInputChange('secondaryColor', preset.secondary);
                          handleInputChange('accentColor', preset.accent);
                        }}
                      >
                        <div className="preset-colors">
                          <div className="preset-color" style={{backgroundColor: preset.primary}}></div>
                          <div className="preset-color" style={{backgroundColor: preset.secondary}}></div>
                          <div className="preset-color" style={{backgroundColor: preset.accent}}></div>
                          </div>
                        <span className="preset-name">{preset.name}</span>
                        </div>
                      ))}
                  </div>
                    </div>
                  </div>
                </div>

            <div className="design-section">
              <h4>Typography</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Font Family</label>
                  <select
                    value={formData.fontFamily}
                    onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                    className="form-input"
                  >
                    {fontFamilies.map(font => (
                      <option key={font.value} value={font.value}>{font.name}</option>
                    ))}
                  </select>
                  <small className="form-help">Choose a font that matches your brand personality</small>
                    </div>
                <div className="form-group">
                  <label>Font Weight</label>
                  <select
                    value={formData.fontWeight || 'normal'}
                    onChange={(e) => handleInputChange('fontWeight', e.target.value)}
                    className="form-input"
                  >
                    <option value="light">Light (300)</option>
                    <option value="normal">Normal (400)</option>
                    <option value="medium">Medium (500)</option>
                    <option value="semibold">Semibold (600)</option>
                    <option value="bold">Bold (700)</option>
                  </select>
                  </div>
                </div>
              
              <div className="typography-preview">
                <h5>Typography Preview</h5>
                <div 
                  className="preview-text"
                  style={{
                    fontFamily: formData.fontFamily,
                    fontWeight: formData.fontWeight || 'normal'
                  }}
                >
                  <h1>Heading 1 - Main Title</h1>
                  <h2>Heading 2 - Section Title</h2>
                  <h3>Heading 3 - Subsection</h3>
                  <p>This is a sample paragraph showing how your text will look with the selected font family and weight. It should be easy to read and professional.</p>
              </div>
              </div>
            </div>

            <div className="design-section">
              <h4>Layout & Style</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Layout Style</label>
                  <select
                    value={formData.layout}
                    onChange={(e) => handleInputChange('layout', e.target.value)}
                    className="form-input"
                  >
                    {layouts.map(layout => (
                      <option key={layout.value} value={layout.value}>{layout.name}</option>
                    ))}
                  </select>
                  <small className="form-help">{layouts.find(l => l.value === formData.layout)?.description}</small>
                </div>
                <div className="form-group">
                  <label>Content Width</label>
                  <select
                    value={formData.contentWidth || 'standard'}
                    onChange={(e) => handleInputChange('contentWidth', e.target.value)}
                    className="form-input"
                  >
                    <option value="narrow">Narrow (800px)</option>
                    <option value="standard">Standard (1200px)</option>
                    <option value="wide">Wide (1400px)</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>
                </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Header Style</label>
                  <select
                    value={formData.headerStyle || 'standard'}
                    onChange={(e) => handleInputChange('headerStyle', e.target.value)}
                    className="form-input"
                  >
                    <option value="standard">Standard Header</option>
                    <option value="minimal">Minimal Header</option>
                    <option value="centered">Centered Header</option>
                    <option value="sidebar">Sidebar Navigation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Footer Style</label>
                  <select
                    value={formData.footerStyle || 'standard'}
                    onChange={(e) => handleInputChange('footerStyle', e.target.value)}
                    className="form-input"
                  >
                    <option value="standard">Standard Footer</option>
                    <option value="minimal">Minimal Footer</option>
                    <option value="extended">Extended Footer</option>
                    <option value="none">No Footer</option>
                  </select>
                          </div>
                        </div>
                      </div>

            <div className="design-section">
              <h4>Brand Assets</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Logo URL</label>
                          <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    className="form-input"
                    placeholder="https://example.com/logo.png"
                  />
                  <small className="form-help">Recommended size: 200x60px or similar aspect ratio</small>
                          </div>
                <div className="form-group">
                  <label>Favicon URL</label>
                  <input
                    type="url"
                    value={formData.favicon}
                    onChange={(e) => handleInputChange('favicon', e.target.value)}
                    className="form-input"
                    placeholder="https://example.com/favicon.ico"
                  />
                  <small className="form-help">Recommended size: 32x32px or 16x16px</small>
                        </div>
                      </div>
              
              <div className="form-group">
                <label>Background Image URL</label>
                <input
                  type="url"
                  value={formData.backgroundImage || ''}
                  onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
                  className="form-input"
                  placeholder="https://example.com/background.jpg"
                />
                <small className="form-help">Optional background image for hero sections</small>
                    </div>
                  </div>

                  <div className="branding-preview">
              <h4>Live Design Preview</h4>
              <div 
                className="preview-card"
                style={{
                  '--primary-color': formData.primaryColor,
                  '--secondary-color': formData.secondaryColor,
                  '--accent-color': formData.accentColor,
                  'font-family': formData.fontFamily,
                  'font-weight': formData.fontWeight || 'normal'
                }}
              >
                      <div className="preview-header">
                  {formData.logo && <img src={formData.logo} alt="Logo" className="preview-logo" />}
                  <h3>{formData.platformName || 'Your Platform'}</h3>
                        </div>
                <p>{formData.description || 'Platform description will appear here'}</p>
                <div className="preview-actions">
                  <button className="preview-btn primary">Primary Button</button>
                  <button className="preview-btn secondary">Secondary Button</button>
                      </div>
                <div className="preview-colors">
                  <div className="color-swatch" style={{backgroundColor: formData.primaryColor}}></div>
                  <div className="color-swatch" style={{backgroundColor: formData.secondaryColor}}></div>
                  <div className="color-swatch" style={{backgroundColor: formData.accentColor}}></div>
                      </div>
                    </div>
                  </div>
                </div>
        );

            case 4:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Template Selection</h3>
              <p>Choose a professional template that matches your training platform needs</p>
            </div>
            
            <div className="template-categories">
              <div className="category-tabs">
                {['all', 'training', 'education', 'corporate', 'modern'].map(category => (
                  <button
                    key={category}
                    className={`category-tab ${formData.templateCategory === category ? 'active' : ''}`}
                    onClick={() => handleInputChange('templateCategory', category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="templates-grid">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${formData.template === template.id ? 'selected' : ''}`}
                  onClick={() => handleInputChange('template', template.id)}
                >
                  <div className="template-preview">
                    <div className="template-icon">{template.icon}</div>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <div className="template-badge">
                      <span className="badge-text">{template.category || 'Professional'}</span>
                    </div>
                  </div>
                  <div className="template-features">
                    {template.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                  <div className="template-stats">
                    <div className="stat">
                      <span className="stat-label">Pages:</span>
                      <span className="stat-value">{template.pageCount || '5'}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Sections:</span>
                      <span className="stat-value">{template.sectionCount || '12'}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Features:</span>
                      <span className="stat-value">{template.features.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="template-customization">
              <h4>Template Customization</h4>
              <div className="customization-options">
                <div className="form-row">
                  <div className="form-group">
                    <label>Layout Style</label>
                    <select
                      value={formData.templateLayout || 'standard'}
                      onChange={(e) => handleInputChange('templateLayout', e.target.value)}
                      className="form-input"
                    >
                      <option value="standard">Standard Layout</option>
                      <option value="sidebar">Sidebar Navigation</option>
                      <option value="centered">Centered Content</option>
                      <option value="dashboard">Dashboard Style</option>
                    </select>
                    <small className="form-help">Choose how your content will be organized</small>
                  </div>
                  <div className="form-group">
                    <label>Navigation Style</label>
                    <select
                      value={formData.navigationStyle || 'top'}
                      onChange={(e) => handleInputChange('navigationStyle', e.target.value)}
                      className="form-input"
                    >
                      <option value="top">Top Navigation</option>
                      <option value="sidebar">Sidebar Navigation</option>
                      <option value="tabs">Tab Navigation</option>
                      <option value="breadcrumb">Breadcrumb Navigation</option>
                    </select>
                    <small className="form-help">How users will navigate your platform</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Content Density</label>
                    <select
                      value={formData.contentDensity || 'balanced'}
                      onChange={(e) => handleInputChange('contentDensity', e.target.value)}
                      className="form-input"
                    >
                      <option value="spacious">Spacious (More whitespace)</option>
                      <option value="balanced">Balanced (Standard spacing)</option>
                      <option value="compact">Compact (Dense content)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Visual Style</label>
                    <select
                      value={formData.visualStyle || 'modern'}
                      onChange={(e) => handleInputChange('visualStyle', e.target.value)}
                      className="form-input"
                    >
                      <option value="minimal">Minimal & Clean</option>
                      <option value="modern">Modern & Bold</option>
                      <option value="classic">Classic & Professional</option>
                      <option value="creative">Creative & Dynamic</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="template-preview-section">
              <h4>Template Preview</h4>
              <div className="preview-container">
                <div className="preview-mockup">
                  <div className="mockup-header">
                    <div className="mockup-logo"></div>
                    <div className="mockup-nav">
                      <div className="nav-item"></div>
                      <div className="nav-item"></div>
                      <div className="nav-item"></div>
                    </div>
                  </div>
                  <div className="mockup-content">
                    <div className="mockup-hero">
                      <div className="hero-title"></div>
                      <div className="hero-subtitle"></div>
                      <div className="hero-button"></div>
                    </div>
                    <div className="mockup-sections">
                      <div className="section-row">
                        <div className="section-card"></div>
                        <div className="section-card"></div>
                        <div className="section-card"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {errors.template && <span className="error-message">{errors.template}</span>}
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Page Builder</h3>
              <p>Create and customize your platform pages with drag-and-drop functionality</p>
            </div>
            
            <div className="page-builder">
              <div className="pages-section">
                <div className="pages-header">
                  <h4>Your Pages ({formData.pages.length})</h4>
                  <div className="pages-actions">
                    <button className="add-page-btn" onClick={addNewPage}>
                      ➕ Add New Page
                    </button>
                    <button className="import-pages-btn">
                      📁 Import Pages
                    </button>
                  </div>
                </div>
                
                <div className="pages-grid">
                  {formData.pages.map((page, index) => (
                    <div key={page.id} className="page-card" draggable="true">
                      <div className="page-header">
                        <div className="page-icon">{getPageIcon(page.type)}</div>
                        <div className="page-status">
                          <span className={`status-badge ${page.status || 'active'}`}>
                            {page.status || 'Active'}
                          </span>
                        </div>
                      </div>
                      <div className="page-info">
                        <h5>{page.name}</h5>
                        <p className="page-url">/{page.slug}</p>
                        <span className="page-template">
                          {pageTemplates.find(t => t.id === page.template)?.name || 'Custom'}
                        </span>
                        <div className="page-meta">
                          <span className="meta-item">📄 {page.sections?.length || 0} sections</span>
                          <span className="meta-item">👁️ {page.views || 0} views</span>
                        </div>
                      </div>
                      <div className="page-actions">
                        <button 
                          className="page-action-btn"
                          onClick={() => editPage(index)}
                          title="Edit Page"
                        >
                          ✏️
                        </button>
                        <button 
                          className="page-action-btn"
                          onClick={() => duplicatePage(index)}
                          title="Duplicate Page"
                        >
                          📋
                        </button>
                        <button 
                          className="page-action-btn"
                          title="Preview Page"
                        >
                          👁️
                        </button>
                        {page.id !== 'home' && (
                          <button 
                            className="page-action-btn delete"
                            onClick={() => deletePage(index)}
                            title="Delete Page"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="content-blocks-section">
                <div className="blocks-header">
                  <h4>Content Blocks</h4>
                  <p>Drag and drop these blocks to build your pages</p>
                </div>
                
                <div className="blocks-categories">
                  <div className="category-section">
                    <h5>📐 Layout Blocks</h5>
                    <div className="blocks-grid">
                      {contentBlocks.filter(block => block.category === 'layout').map(block => (
                        <div key={block.id} className="block-card" draggable="true">
                          <div className="block-icon">{block.icon}</div>
                          <div className="block-info">
                            <h6>{block.name}</h6>
                            <p>{block.description}</p>
                            <span className="block-category">{block.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="category-section">
                    <h5>📝 Content Blocks</h5>
                    <div className="blocks-grid">
                      {contentBlocks.filter(block => block.category === 'content').map(block => (
                        <div key={block.id} className="block-card" draggable="true">
                          <div className="block-icon">{block.icon}</div>
                          <div className="block-info">
                            <h6>{block.name}</h6>
                            <p>{block.description}</p>
                            <span className="block-category">{block.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="category-section">
                    <h5>🎯 Interactive Blocks</h5>
                    <div className="blocks-grid">
                      {contentBlocks.filter(block => ['forms', 'social', 'commerce'].includes(block.category)).map(block => (
                        <div key={block.id} className="block-card" draggable="true">
                          <div className="block-icon">{block.icon}</div>
                          <div className="block-info">
                            <h6>{block.name}</h6>
                            <p>{block.description}</p>
                            <span className="block-category">{block.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="page-settings">
              <h4>Page Settings</h4>
              <div className="settings-grid">
                <div className="form-group">
                  <label>Default Page Template</label>
                  <select
                    value={formData.defaultPageTemplate || 'standard'}
                    onChange={(e) => handleInputChange('defaultPageTemplate', e.target.value)}
                    className="form-input"
                  >
                    <option value="standard">Standard Page</option>
                    <option value="landing">Landing Page</option>
                    <option value="dashboard">Dashboard Page</option>
                    <option value="course">Course Page</option>
                    <option value="blog">Blog Page</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Page Navigation</label>
                  <select
                    value={formData.pageNavigation || 'auto'}
                    onChange={(e) => handleInputChange('pageNavigation', e.target.value)}
                    className="form-input"
                  >
                    <option value="auto">Auto-generate from pages</option>
                    <option value="manual">Manual navigation setup</option>
                    <option value="hidden">Hidden navigation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>SEO Settings</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.autoSeo || false}
                        onChange={(e) => handleInputChange('autoSeo', e.target.checked)}
                      />
                      Auto-generate SEO meta tags
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.sitemap || false}
                        onChange={(e) => handleInputChange('sitemap', e.target.checked)}
                      />
                      Include in sitemap
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Content Setup</h3>
              <p>Create compelling content that engages your audience and drives results</p>
            </div>
            
            <div className="content-sections">
              <div className="content-section">
                <h4>Hero Section</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Hero Title *</label>
                    <input
                      type="text"
                      value={formData.heroTitle}
                      onChange={(e) => handleInputChange('heroTitle', e.target.value)}
                      className={`form-input ${errors.heroTitle ? 'error' : ''}`}
                      placeholder="Welcome to Your Training Platform"
                    />
                    <small className="form-help">Main headline that captures attention</small>
                    {errors.heroTitle && <span className="error-message">{errors.heroTitle}</span>}
                  </div>
                  <div className="form-group">
                    <label>Hero Subtitle *</label>
                    <textarea
                      value={formData.heroSubtitle}
                      onChange={(e) => handleInputChange('heroSubtitle', e.target.value)}
                      className={`form-textarea ${errors.heroSubtitle ? 'error' : ''}`}
                      rows="3"
                      placeholder="Start your learning journey with our comprehensive training programs"
                    />
                    <small className="form-help">Supporting text that explains your value proposition</small>
                    {errors.heroSubtitle && <span className="error-message">{errors.heroSubtitle}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Call-to-Action Button Text</label>
                    <input
                      type="text"
                      value={formData.ctaText || 'Get Started'}
                      onChange={(e) => handleInputChange('ctaText', e.target.value)}
                      className="form-input"
                      placeholder="Get Started"
                    />
                  </div>
                  <div className="form-group">
                    <label>Hero Background Image URL</label>
                    <input
                      type="url"
                      value={formData.heroBackground || ''}
                      onChange={(e) => handleInputChange('heroBackground', e.target.value)}
                      className="form-input"
                      placeholder="https://example.com/hero-bg.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="content-section">
                <h4>About Section</h4>
                <div className="form-group">
                  <label>About Title</label>
                  <input
                    type="text"
                    value={formData.aboutTitle || 'About Our Platform'}
                    onChange={(e) => handleInputChange('aboutTitle', e.target.value)}
                    className="form-input"
                    placeholder="About Our Platform"
                  />
                </div>
                <div className="form-group">
                  <label>About Description</label>
                  <textarea
                    value={formData.aboutDescription || ''}
                    onChange={(e) => handleInputChange('aboutDescription', e.target.value)}
                    className="form-textarea"
                    rows="4"
                    placeholder="Tell your audience what makes your platform special..."
                  />
                </div>
              </div>

              <div className="content-section">
                <h4>Features Section</h4>
                <div className="features-builder">
                  <div className="features-header">
                    <h5>Platform Features</h5>
                    <button className="add-feature-btn" onClick={() => addFeature()}>
                      ➕ Add Feature
                    </button>
                  </div>
                  <div className="features-list">
                    {(formData.features || []).map((feature, index) => (
                      <div key={index} className="feature-item">
                        <div className="feature-inputs">
                          <input
                            type="text"
                            value={feature.title}
                            onChange={(e) => updateFeature(index, 'title', e.target.value)}
                            className="form-input"
                            placeholder="Feature title"
                          />
                          <textarea
                            value={feature.description}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            className="form-textarea"
                            rows="2"
                            placeholder="Feature description"
                          />
                        </div>
                        <button 
                          className="remove-feature-btn"
                          onClick={() => removeFeature(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="content-section">
                <h4>Contact Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail || ''}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="form-input"
                      placeholder="contact@yourcompany.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={formData.contactPhone || ''}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.contactAddress || ''}
                    onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                    className="form-textarea"
                    rows="2"
                    placeholder="Your company address"
                  />
                </div>
              </div>
            </div>

            <div className="content-preview">
              <h4>Live Preview</h4>
              <div className="preview-hero">
                <div className="preview-bg" style={{
                  backgroundImage: formData.heroBackground ? `url(${formData.heroBackground})` : 'none'
                }}>
                  <h1>{formData.heroTitle || 'Welcome to Your Training Platform'}</h1>
                  <p>{formData.heroSubtitle || 'Start your learning journey with our comprehensive training programs'}</p>
                  <button className="preview-cta">
                    {formData.ctaText || 'Get Started'}
                  </button>
                </div>
              </div>
              
              {formData.aboutTitle && (
                <div className="preview-about">
                  <h2>{formData.aboutTitle}</h2>
                  <p>{formData.aboutDescription}</p>
                </div>
              )}
              
              {(formData.features || []).length > 0 && (
                <div className="preview-features">
                  <h2>Features</h2>
                  <div className="features-grid">
                    {(formData.features || []).map((feature, index) => (
                      <div key={index} className="feature-card">
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Advanced Features</h3>
              <p>Enable powerful features to enhance your training platform</p>
            </div>
            
            <div className="features-categories">
              <div className="feature-category">
                <h4>🎓 Learning & Training</h4>
                <div className="features-grid">
                  {Object.entries(formData.features).filter(([key]) => 
                    ['userRegistration', 'progressTracking', 'certificates', 'quizzes'].includes(key)
                  ).map(([key, value]) => (
                    <div key={key} className="feature-setting">
                      <label className="feature-label">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              features: {
                                ...prev.features,
                                [key]: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div className="feature-content">
                          <div className="feature-icon">
                            {key === 'userRegistration' && '👤'}
                            {key === 'progressTracking' && '📊'}
                            {key === 'certificates' && '🏆'}
                            {key === 'quizzes' && '❓'}
                          </div>
                          <div className="feature-text">
                            <strong>{getFeatureName(key)}</strong>
                            <small>{getFeatureDescription(key)}</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feature-category">
                <h4>🔧 Platform Management</h4>
                <div className="features-grid">
                  {Object.entries(formData.features).filter(([key]) => 
                    ['analytics', 'notifications', 'userManagement', 'contentManagement'].includes(key)
                  ).map(([key, value]) => (
                    <div key={key} className="feature-setting">
                      <label className="feature-label">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              features: {
                                ...prev.features,
                                [key]: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div className="feature-content">
                          <div className="feature-icon">
                            {key === 'analytics' && '📈'}
                            {key === 'notifications' && '🔔'}
                            {key === 'userManagement' && '👥'}
                            {key === 'contentManagement' && '📝'}
                          </div>
                          <div className="feature-text">
                            <strong>{getFeatureName(key)}</strong>
                            <small>{getFeatureDescription(key)}</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feature-category">
                <h4>🌐 Integration & API</h4>
                <div className="features-grid">
                  {Object.entries(formData.features).filter(([key]) => 
                    ['apiAccess', 'webhooks', 'sso', 'thirdPartyIntegrations'].includes(key)
                  ).map(([key, value]) => (
                    <div key={key} className="feature-setting">
                      <label className="feature-label">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              features: {
                                ...prev.features,
                                [key]: e.target.checked
                              }
                            }));
                          }}
                        />
                        <div className="feature-content">
                          <div className="feature-icon">
                            {key === 'apiAccess' && '🔌'}
                            {key === 'webhooks' && '🪝'}
                            {key === 'sso' && '🔐'}
                            {key === 'thirdPartyIntegrations' && '🔗'}
                          </div>
                          <div className="feature-text">
                            <strong>{getFeatureName(key)}</strong>
                            <small>{getFeatureDescription(key)}</small>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feature-settings">
              <h4>Feature Configuration</h4>
              <div className="settings-grid">
                <div className="form-group">
                  <label>Default User Role</label>
                  <select
                    value={formData.defaultUserRole || 'student'}
                    onChange={(e) => handleInputChange('defaultUserRole', e.target.value)}
                    className="form-input"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrator</option>
                    <option value="viewer">Viewer Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Content Access Level</label>
                  <select
                    value={formData.contentAccess || 'authenticated'}
                    onChange={(e) => handleInputChange('contentAccess', e.target.value)}
                    className="form-input"
                  >
                    <option value="public">Public (No login required)</option>
                    <option value="authenticated">Authenticated Users Only</option>
                    <option value="enrolled">Enrolled Students Only</option>
                    <option value="premium">Premium Users Only</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Progress Tracking Granularity</label>
                  <select
                    value={formData.progressGranularity || 'course'}
                    onChange={(e) => handleInputChange('progressGranularity', e.target.value)}
                    className="form-input"
                  >
                    <option value="course">Course Level</option>
                    <option value="lesson">Lesson Level</option>
                    <option value="activity">Activity Level</option>
                    <option value="detailed">Detailed Tracking</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="feature-preview">
              <h4>Enabled Features Summary</h4>
              <div className="enabled-features">
                {Object.entries(formData.features).filter(([key, value]) => value).map(([key, value]) => (
                  <div key={key} className="enabled-feature">
                    <span className="feature-icon">
                      {key === 'userRegistration' && '👤'}
                      {key === 'progressTracking' && '📊'}
                      {key === 'certificates' && '🏆'}
                      {key === 'quizzes' && '❓'}
                      {key === 'analytics' && '📈'}
                      {key === 'notifications' && '🔔'}
                      {key === 'userManagement' && '👥'}
                      {key === 'contentManagement' && '📝'}
                      {key === 'apiAccess' && '🔌'}
                      {key === 'webhooks' && '🪝'}
                      {key === 'sso' && '🔐'}
                      {key === 'thirdPartyIntegrations' && '🔗'}
                    </span>
                    <span className="feature-name">{getFeatureName(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="step-content">
            <div className="step-header">
              <h3>Platform Settings</h3>
              <p>Configure access, security, and final platform settings</p>
            </div>
            
            <div className="settings-sections">
              <div className="settings-section">
                <h4>🔐 Access & Security</h4>
                <div className="settings-grid">
                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      />
                      <div className="setting-content">
                        <div className="setting-icon">🌐</div>
                        <div className="setting-text">
                          <strong>Public Platform</strong>
                          <small>Allow public access to the platform</small>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={formData.allowRegistration}
                        onChange={(e) => handleInputChange('allowRegistration', e.target.checked)}
                      />
                      <div className="setting-content">
                        <div className="setting-icon">👤</div>
                        <div className="setting-text">
                          <strong>Allow Registration</strong>
                          <small>Users can register themselves</small>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={formData.requireApproval}
                        onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                      />
                      <div className="setting-content">
                        <div className="setting-icon">✅</div>
                        <div className="setting-text">
                          <strong>Require Approval</strong>
                          <small>New users need admin approval</small>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={formData.enableTwoFactor || false}
                        onChange={(e) => handleInputChange('enableTwoFactor', e.target.checked)}
                      />
                      <div className="setting-content">
                        <div className="setting-icon">🔒</div>
                        <div className="setting-text">
                          <strong>Two-Factor Authentication</strong>
                          <small>Enhanced security for user accounts</small>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h4>👥 User Management</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Maximum Users</label>
                    <input
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) => handleInputChange('maxUsers', parseInt(e.target.value))}
                      className="form-input"
                      min="1"
                      max="10000"
                    />
                    <small className="form-help">Set a limit on total platform users</small>
                  </div>
                  <div className="form-group">
                    <label>User Session Timeout</label>
                    <select
                      value={formData.sessionTimeout || '24'}
                      onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                      className="form-input"
                    >
                      <option value="1">1 Hour</option>
                      <option value="8">8 Hours</option>
                      <option value="24">24 Hours</option>
                      <option value="168">7 Days</option>
                      <option value="720">30 Days</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Default User Permissions</label>
                    <select
                      value={formData.defaultPermissions || 'read'}
                      onChange={(e) => handleInputChange('defaultPermissions', e.target.value)}
                      className="form-input"
                    >
                      <option value="read">Read Only</option>
                      <option value="participate">Participate in Courses</option>
                      <option value="create">Create Content</option>
                      <option value="moderate">Moderate Platform</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>User Data Retention</label>
                    <select
                      value={formData.dataRetention || 'indefinite'}
                      onChange={(e) => handleInputChange('dataRetention', e.target.value)}
                      className="form-input"
                    >
                      <option value="indefinite">Indefinite</option>
                      <option value="1year">1 Year</option>
                      <option value="2years">2 Years</option>
                      <option value="5years">5 Years</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h4>🌐 SEO & Analytics</h4>
                <div className="form-group">
                  <label>Meta Title</label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) => handleInputChange('seo', { ...formData.seo, metaTitle: e.target.value })}
                    className="form-input"
                    placeholder="Your Platform - Training & Education"
                  />
                  <small className="form-help">Appears in search engine results (50-60 characters)</small>
                </div>
                <div className="form-group">
                  <label>Meta Description</label>
                  <textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) => handleInputChange('seo', { ...formData.seo, metaDescription: e.target.value })}
                    className="form-textarea"
                    rows="3"
                    placeholder="Learn new skills with our comprehensive training platform..."
                  />
                  <small className="form-help">Brief description for search engines (150-160 characters)</small>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Google Analytics ID</label>
                    <input
                      type="text"
                      value={formData.analytics?.googleAnalytics || ''}
                      onChange={(e) => handleInputChange('analytics', { 
                        ...formData.analytics, 
                        googleAnalytics: e.target.value 
                      })}
                      className="form-input"
                      placeholder="GA-XXXXXXXXX-X"
                    />
                  </div>
                  <div className="form-group">
                    <label>Google Tag Manager ID</label>
                    <input
                      type="text"
                      value={formData.analytics?.gtm || ''}
                      onChange={(e) => handleInputChange('analytics', { 
                        ...formData.analytics, 
                        gtm: e.target.value 
                      })}
                      className="form-input"
                      placeholder="GTM-XXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h4>⚙️ Advanced Settings</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Platform Timezone</label>
                    <select
                      value={formData.timezone || 'UTC'}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="form-input"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Default Language</label>
                    <select
                      value={formData.defaultLanguage || 'en'}
                      onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                      className="form-input"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Custom CSS</label>
                  <textarea
                    value={formData.customCSS || ''}
                    onChange={(e) => handleInputChange('customCSS', e.target.value)}
                    className="form-textarea"
                    rows="4"
                    placeholder="/* Add custom CSS styles here */"
                  />
                  <small className="form-help">Add custom styling to override default themes</small>
                </div>
              </div>
            </div>

            <div className="platform-summary">
              <h4>Platform Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Platform Name:</span>
                  <span className="summary-value">{formData.platformName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">URL Slug:</span>
                  <span className="summary-value">/{formData.platformSlug}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Template:</span>
                  <span className="summary-value">{templates.find(t => t.id === formData.template)?.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Pages:</span>
                  <span className="summary-value">{formData.pages.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Features:</span>
                  <span className="summary-value">{Object.values(formData.features).filter(Boolean).length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Max Users:</span>
                  <span className="summary-value">{formData.maxUsers}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-platform-modal-overlay">
      <div className="create-platform-modal">
        <div className="modal-header">
          <div className="header-content">
            <h2>Create New Platform</h2>
            <p>Set up a new training platform for your company</p>
                    </div>
          <button className="modal-close" onClick={onClose}>×</button>
                  </div>

        <div className="modal-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
                </div>
          <div className="progress-steps">
            {[
              { number: 1, label: 'Company' },
              { number: 2, label: 'Details' },
              { number: 3, label: 'Design' },
              { number: 4, label: 'Template' },
              { number: 5, label: 'Pages' },
              { number: 6, label: 'Content' },
              { number: 7, label: 'Features' },
              { number: 8, label: 'Settings' }
            ].map((step, i) => (
              <div key={step.number} className="progress-step-container">
                <div 
                  className={`progress-step ${
                    currentStep > step.number ? 'completed' : 
                    currentStep === step.number ? 'active' : ''
                  }`}
                >
                  {currentStep > step.number ? '' : step.number}
              </div>
                <span className="progress-label">{step.label}</span>
              </div>
            ))}
          </div>
          </div>

        {renderStepContent()}

          <div className="modal-footer">
          <div className="footer-left">
            {currentStep > 1 && (
              <button className="btn-secondary" onClick={prevStep}>
                ← Previous
              </button>
            )}
            {currentStep >= 2 && (
              <button 
                className={`btn-preview ${previewWindow && !previewWindow.closed ? 'preview-open' : ''}`}
                onClick={handlePreview}
                title={previewWindow && !previewWindow.closed ? "Preview is live - changes update automatically" : "Open platform preview in new tab"}
              >
                {previewWindow && !previewWindow.closed ? '🔄 Live Preview' : '👁️ Preview'}
              </button>
            )}
          </div>
          <div className="footer-center">
          </div>
          <div className="footer-right">
            <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            {currentStep < totalSteps ? (
              <button className="btn-primary" onClick={nextStep}>
                Next →
              </button>
            ) : (
              <button 
                className="btn-primary"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Platform'}
              </button>
            )}
            </div>
          </div>

        {errors.submit && (
          <div className="error-banner">
            {errors.submit}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePlatformModal;