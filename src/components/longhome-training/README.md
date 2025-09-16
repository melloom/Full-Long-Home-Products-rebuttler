# Long Home Training Components

This folder contains ALL components related to Long Home's company training platform, including rebuttal management, lead disposition, scheduling, customer service, FAQ, and core UI components.

## Company Training Components

### CompanyPlatform.jsx
Main platform component that handles routing and state management for the Long Home training platform.

### CompanyLanding.jsx
Landing page component that displays the company's training platform welcome page.

### CompanyLogin.jsx
Login component for company users to access the training platform.

### CompanyTraining.jsx
Main training component that provides access to training materials, rebuttals, and resources.

### CompanyStatusCheck.jsx
Component that checks and enforces company status requirements.

## Rebuttal & Lead Management Components

### RebuttalCard.jsx
Component for displaying individual rebuttal cards with responses.

### RebuttalLibrary.jsx
Main rebuttal library component with search, filtering, and categorization.

### RebuttalSidebar.jsx
Sidebar component for rebuttal navigation and tips.

### CategorySidebar.jsx
Sidebar component for category-based navigation.

### LeadDisposition.jsx
Component for managing lead dispositions and outcomes.

## Core Long Home Components

### SearchBar.jsx
Universal search bar component used throughout the Long Home platform.

### ScheduleScript.jsx
Comprehensive scheduling and appointment management component.

### Header.jsx
Main header component for Long Home pages and navigation.

### FAQ.jsx
Frequently Asked Questions component with search and management.

### CustomerService.jsx
Customer service management and support component.

## Admin Components

### Admin Dashboard & Login
- **AdminDashboard.jsx** - Main admin dashboard component
- **AdminLogin.jsx** - Admin login component
- **AdminSetup.jsx** - Admin setup component
- **AdminSettings.jsx** - Admin settings management
- **AdminDashboardTest.jsx** - Admin dashboard testing component

### SaaS Admin Components
- **SaasAdminDashboard.jsx** - SaaS admin dashboard
- **SaasAdminLogin.jsx** - SaaS admin login
- **SaasCompaniesManagement.jsx** - Company management
- **SaasPlatformsManagement.jsx** - Platform management
- **SaasUsersManagement.jsx** - User management
- **SaasDashboardOverview.jsx** - Dashboard overview
- **SaasDeletedCompanies.jsx** - Deleted companies management

### Management Components
- **UserManagement.jsx** - User management system
- **RebuttalManagement.jsx** - Rebuttal management
- **RebuttalForm.jsx** - Rebuttal form component
- **CategoryManagement.jsx** - Category management
- **CustomerServiceManagement.jsx** - Customer service management
- **CustomerServiceManager.jsx** - Customer service manager
- **FAQManagement.jsx** - FAQ management
- **LeadDispositionManagement.jsx** - Lead disposition management
- **TimeBlockManagement.jsx** - Time block management

### Platform Components
- **PlatformBuilder.jsx** - Platform builder component
- **DashboardView.jsx** - Dashboard view component

### Test Components
- **FirebaseTest.jsx** - Firebase testing component
- **ErrorBoundaryTest.jsx** - Error boundary testing

### Modal Components
- **CompanyModal.jsx** - Company modal
- **EditAdminModal.jsx** - Edit admin modal
- **UserModal.jsx** - User modal
- **CreatePlatformModal.jsx** - Create platform modal
- **PlatformModal.jsx** - Platform modal
- **DeleteConfirmModal.jsx** - Delete confirmation modal
- **UniversalModal.jsx** - Universal modal

## CSS Files

Each component has its corresponding CSS file for styling:
- CompanyPlatform.css
- CompanyLanding.css
- CompanyLogin.css
- CompanyTraining.css
- CompanyStatusCheck.css
- RebuttalLibrary.css
- LeadDisposition.css
- SearchBar.css
- ScheduleScript.css
- Header.css
- FAQ.css
- CustomerService.css
- AdminDashboard.css
- AdminLogin.css
- AdminSettings.css
- SaasAdminDashboard.css
- SaasAdminLogin.css
- UserManagement.css
- RebuttalManagement.css
- RebuttalForm.css
- CategoryManagement.css
- CustomerServiceManagement.css
- CustomerServiceManager.css
- FAQManagement.css
- LeadDispositionManagement.css
- TimeBlockManagement.css
- DashboardView.css
- CreatePlatformModal.css

## Usage

```javascript
import { 
  // Company Training
  CompanyPlatform, 
  CompanyLanding, 
  CompanyLogin, 
  CompanyTraining, 
  CompanyStatusCheck,
  
  // Rebuttal & Lead Management
  RebuttalCard,
  RebuttalLibrary,
  RebuttalSidebar,
  CategorySidebar,
  LeadDisposition,
  
  // Core Components
  SearchBar,
  ScheduleScript,
  Header,
  FAQ,
  CustomerService,
  
  // Admin Components
  AdminDashboard,
  AdminLogin,
  AdminSetup,
  AdminSettings,
  SaasAdminDashboard,
  SaasAdminLogin,
  UserManagement,
  RebuttalManagement,
  RebuttalForm,
  CategoryManagement,
  CustomerServiceManagement,
  FAQManagement,
  LeadDispositionManagement,
  TimeBlockManagement,
  PlatformBuilder,
  DashboardView,
  FirebaseTest,
  ErrorBoundaryTest,
  
  // Modal Components
  CompanyModal,
  EditAdminModal,
  UserModal,
  CreatePlatformModal,
  PlatformModal,
  DeleteConfirmModal,
  UniversalModal
} from './components/longhome-training';
```

## Features

- **Complete Long Home Platform**: All components in one organized folder
- Company-specific training platform
- User authentication and authorization
- Training material access
- Comprehensive rebuttal library
- Lead disposition management
- Appointment scheduling and management
- Customer service support
- FAQ management
- **Complete Admin System**: Full admin dashboard and management
- **SaaS Admin Features**: Multi-tenant platform management
- User management and role-based access
- Content management (rebuttals, FAQs, categories)
- Platform builder and customization
- Time block and scheduling management
- Search and filtering capabilities
- Category-based organization
- Status checking and enforcement
- Modal-based interactions
- Testing and debugging components
- Responsive design
- Modern UI/UX

## Dependencies

- React
- React Router
- Firebase Firestore
- CSS3 for styling
- Tesseract.js (for OCR in ScheduleScript)
- Framer Motion (for animations)
- Lucide React (for icons)