export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.warn('Copy failed, falling back to prompt');
    prompt('Copy this URL:', text);
  }
};

export const timeAgo = (date) => {
  const now = new Date();
  const activityDate = date.toDate ? date.toDate() : new Date(date);
  const diffMs = now - activityDate;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return activityDate.toLocaleDateString();
};

export const getIndustryCounts = (companies) => {
  return companies.reduce((acc, company) => {
    const industry = company.industry || 'Other';
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {});
};

export const getPlanCounts = (companies) => {
  return companies.reduce((acc, company) => {
    const plan = company.plan || 'starter';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});
};

export const generatePlatformForm = (platform = null) => {
  const defaultForm = {
    name: '',
    companyId: '',
    domain: '',
    description: '',
    theme: 'default',
    features: {
      rebuttals: true,
      dispositions: true,
      customerService: true,
      faq: true,
      scheduling: true,
      analytics: true,
      notifications: true,
      gamification: false,
      certificates: false,
      progressTracking: true,
      socialLearning: false,
      mobileApp: false
    },
    branding: {
      logo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
      customCSS: ''
    },
    pages: {
      home: {
        title: 'Home',
        slug: 'home',
        layout: 'default',
        content: {
          hero: {
            title: 'Welcome to Our Training Platform',
            subtitle: 'Master your skills with our comprehensive training programs',
            backgroundImage: '',
            ctaText: 'Get Started',
            ctaLink: '/training'
          },
          sections: [
            {
              type: 'features',
              title: 'Key Features',
              content: 'Our platform offers comprehensive training solutions'
            },
            {
              type: 'testimonials',
              title: 'What Our Users Say',
              content: 'Real feedback from our training participants'
            }
          ]
        },
        sidebar: {
          enabled: true,
          position: 'left',
          widgets: ['navigation', 'progress', 'quick-actions']
        }
      }
    },
    navigation: {
      main: [
        { label: 'Home', url: '/', icon: '🏠' },
        { label: 'Training', url: '/training', icon: '🎓' },
        { label: 'Rebuttals', url: '/rebuttals', icon: '💬' },
        { label: 'FAQ', url: '/faq', icon: '❓' },
        { label: 'Contact', url: '/contact', icon: '📞' }
      ],
      footer: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' },
        { label: 'Support', url: '/support' }
      ]
    },
    settings: {
      allowRegistration: true,
      requireEmailVerification: false,
      enableNotifications: true,
      enableAnalytics: true,
      enableMaintenanceMode: false,
      maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.'
    }
  };

  if (platform) {
    return {
      ...defaultForm,
      ...platform,
      features: { ...defaultForm.features, ...platform.features },
      branding: { ...defaultForm.branding, ...platform.branding },
      pages: { ...defaultForm.pages, ...platform.pages },
      navigation: { ...defaultForm.navigation, ...platform.navigation },
      settings: { ...defaultForm.settings, ...platform.settings }
    };
  }

  return defaultForm;
};

export const generateAppPageContent = (companyData, categoriesData, rebuttalsData, faqsData) => {
  return {
    title: 'Training Platform',
    slug: 'app',
    layout: 'training',
    content: {
      header: {
        logo: companyData.logo || '🏢',
        companyName: companyData.name || 'Training Platform',
        welcomeText: companyData.welcomeMessage || 'Welcome to your training platform'
      },
      sidebar: {
        navigation: [
          { id: 'dashboard', label: 'Dashboard', icon: '🏠', active: true },
          { id: 'rebuttals', label: 'Rebuttals', icon: '💬', active: false },
          { id: 'faq', label: 'FAQ', icon: '❓', active: false },
          { id: 'training', label: 'Training', icon: '🎓', active: false }
        ]
      },
      mainContent: {
        dashboard: {
          title: 'Dashboard',
          description: 'Overview of your training progress'
        },
        rebuttals: {
          title: 'Rebuttals',
          description: 'Learn effective responses to common objections',
          rebuttals: rebuttalsData || [],
          categories: categoriesData || []
        },
        faq: {
          title: 'FAQ',
          description: 'Find answers to common questions',
          faqs: faqsData || []
        }
      }
    }
  };
};