# Muayene ve Raporlama Sistemi - Frontend Planlaması

Bu dokümantasyon, mevcut backend API'si üzerine inşa edilecek React.js frontend uygulamasının detaylı planlamasını içerir.

## 🎯 Proje Özeti

### Frontend Ne Yapacak?
Mühendislik firmalarının muayene ve raporlama süreçlerini yönetebileceği modern, responsive web arayüzü. Backend'de hazır olan 60+ API endpoint'i kullanarak tam işlevsel bir web uygulaması.

### Ana Hedefler
- **Kullanıcı Dostu**: Sade, modern ve anlaşılır arayüz
- **Mobile-First**: Responsive tasarım, mobil uyumlu
- **Permission-Based**: Granular yetki sistemine uygun arayüz
- **Multi-Tenant**: Her firma kendi verilerini yönetir
- **Real-Time**: Anlık veri güncellemeleri

## 🛠 Teknoloji Stack

### Core Technologies
- **React.js 18** - UI library (TypeScript olmadan)
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management

### UI Framework & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled accessible components
- **Heroicons** - Icon set
- **Framer Motion** - Animations (optional)

### Data Management
- **RTK Query** - API state management
- **React Query** (alternative) - Server state management
- **Zustand** (lightweight alternative) - Global state

### Form & Validation
- **React Hook Form** - Form handling
- **Yup** - Validation schema
- **React Select** - Advanced select components

### File Upload & Media
- **React Dropzone** - File upload component
- **React Image Gallery** - Photo viewer
- **PDF.js** - PDF viewing capability

### Date & Time
- **Date-fns** - Date manipulation
- **React DatePicker** - Date/time selection

### Additional Tools
- **QR Code Generator** - QR code generation for reports
- **Chart.js/Recharts** - Dashboard charts
- **React Hot Toast** - Notifications
- **React Loading Skeleton** - Loading states

## 🏗 Proje Yapısı

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components
│   │   ├── forms/          # Form components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Basic UI components
│   ├── features/           # Feature-based modules
│   │   ├── auth/           # Authentication
│   │   ├── companies/      # Company management
│   │   ├── technicians/    # Technician management
│   │   ├── customers/      # Customer companies
│   │   ├── equipment/      # Equipment management
│   │   ├── offers/         # Offer management
│   │   ├── workOrders/     # Work order management
│   │   ├── inspections/    # Inspection management
│   │   ├── reports/        # Report management
│   │   └── dashboard/      # Dashboard
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # Redux store
│   ├── utils/              # Utility functions
│   ├── constants/          # Constants and configs
│   ├── types/              # TypeScript types (if used)
│   ├── assets/             # Static assets
│   └── App.js              # Main App component
├── package.json
├── tailwind.config.js
└── .env
```

## 👥 Kullanıcı Rolleri ve Arayüzler

### 1. Super Admin
**Ana Sayfası**: System Dashboard
- **Erişim**: Tüm firmaları yönetme
- **Özellikler**:
  - Firma oluşturma, düzenleme, silme
  - Sistem geneli istatistikler
  - Firma listesi ve detayları
  - Global ayarlar

### 2. Company Admin (Firma Admini)
**Ana Sayfası**: Company Dashboard  
- **Erişim**: Kendi firmasının tüm verileri
- **Özellikler**:
  - Dashboard (istatistikler, grafikler)
  - Teknisyen yönetimi (CRUD + permissions)
  - Müşteri firma yönetimi
  - Ekipman ve şablon yönetimi
  - Teklif yönetimi
  - İş emri yönetimi
  - Rapor yönetimi
  - Firma profil ayarları

### 3. Technician (Teknisyen)
**Ana Sayfası**: Personal Dashboard
- **Erişim**: Kendine atanmış işler
- **Özellikler**:
  - Atanmış iş emirleri listesi
  - Muayene formu doldurma
  - Fotoğraf yükleme
  - Rapor imzalama
  - Kişisel takvim
  - Profil ayarları

### 4. Customer (Public Access)
**Ana Sayfası**: Report Tracking
- **Erişim**: Public sayfa
- **Özellikler**:
  - QR kod ile rapor erişimi
  - Teklif tracking sayfası
  - Rapor görüntüleme (readonly)

## 📱 Sayfa Yapısı ve Rotalar

### Public Routes (Authentication gerekmez)
```
/                           # Landing page
/login                      # Login sayfası  
/offers/track/:token        # Public offer tracking
/reports/public/:qrToken    # Public report access
/404                        # Not found page
```

### Protected Routes (Authentication gerekir)
```
/dashboard                  # Ana dashboard (role-based)
/profile                    # User profile settings

# Company Management (Super Admin)
/admin/companies            # Company list
/admin/companies/new        # Create company
/admin/companies/:id        # Company detail
/admin/companies/:id/edit   # Edit company

# Technician Management (Company Admin)
/technicians                # Technician list
/technicians/new           # Add technician
/technicians/:id           # Technician detail
/technicians/:id/edit      # Edit technician
/technicians/:id/permissions # Manage permissions

# Customer Companies
/customers                  # Customer list
/customers/new             # Add customer
/customers/:id             # Customer detail  
/customers/:id/edit        # Edit customer

# Equipment Management
/equipment                  # Equipment list
/equipment/new             # Add equipment
/equipment/:id             # Equipment detail
/equipment/:id/edit        # Edit equipment
/equipment/:id/template    # Edit template

# Offers
/offers                     # Offer list
/offers/new                # Create offer
/offers/:id                # Offer detail
/offers/:id/edit           # Edit offer

# Work Orders
/work-orders               # Work order list
/work-orders/new           # Create work order
/work-orders/:id           # Work order detail
/work-orders/:id/edit      # Edit work order

# Inspections
/inspections               # Inspection list
/inspections/new           # Create inspection
/inspections/:id           # Inspection detail
/inspections/:id/edit      # Edit inspection (form)

# Reports
/reports                   # Report list
/reports/:id               # Report detail
/reports/:id/sign          # E-signature page

# Settings
/settings/company          # Company settings
/settings/profile          # Personal settings
```

## 🎨 UI/UX Tasarım Prensipleri

### Renk Paleti

#### Light Mode (Gündüz Modu)
```css
/* Primary Colors - Professional Dark Tones */
--primary-50: #f8fafc;   /* Very light gray */
--primary-100: #f1f5f9;  /* Light gray background */
--primary-500: #475569;  /* Dark slate gray - main */
--primary-600: #334155;  /* Darker slate */
--primary-700: #1e293b;  /* Very dark slate */
--primary-800: #0f172a;  /* Near black */

/* Gray Scale - Light Mode */
--gray-50: #f8fafc;     /* Background light */
--gray-100: #f1f5f9;    /* Card backgrounds */
--gray-200: #e2e8f0;    /* Borders */
--gray-300: #cbd5e1;    /* Disabled elements */
--gray-400: #94a3b8;    /* Muted text */
--gray-500: #64748b;    /* Secondary text */
--gray-600: #475569;    /* Primary text */
--gray-700: #334155;    /* Headings */
--gray-800: #1e293b;    /* Dark headings */
--gray-900: #0f172a;    /* Strongest text */

/* Status Colors - Muted Professional */
--success: #059669;     /* Dark green */
--warning: #d97706;     /* Dark amber */
--error: #dc2626;       /* Dark red */
--info: #0369a1;        /* Dark blue */
```

#### Dark Mode (Gece Modu)
```css
/* Dark Mode Colors */
--dark-bg-primary: #0f172a;      /* Main background */
--dark-bg-secondary: #1e293b;    /* Card backgrounds */
--dark-bg-tertiary: #334155;     /* Elevated surfaces */

--dark-text-primary: #f1f5f9;    /* Main text */
--dark-text-secondary: #cbd5e1;  /* Secondary text */
--dark-text-muted: #94a3b8;      /* Muted text */

--dark-border: #334155;          /* Borders */
--dark-accent: #64748b;          /* Accent elements */

/* Dark Mode Status Colors */
--dark-success: #10b981;         /* Bright green */
--dark-warning: #f59e0b;         /* Bright amber */
--dark-error: #ef4444;           /* Bright red */
--dark-info: #3b82f6;            /* Bright blue */
```

### Typography
- **Headings**: Inter font, font-semibold
- **Body**: Inter font, font-normal
- **Monospace**: JetBrains Mono (for codes, IDs)

### Layout Pattern
- **Sidebar Navigation**: Collapsible, icon + text
- **Header**: Company logo, user menu, notifications
- **Main Content**: Breadcrumb + page content
- **Cards**: Shadow-sm, rounded-lg, clean borders

### Component Standards
- **Buttons**: Consistent sizing (sm, md, lg)
- **Forms**: Floating labels, clear validation
- **Tables**: Sortable, filterable, pagination
- **Modals**: Centered, backdrop blur
- **Loading States**: Skeleton components

## 🔧 State Management

### Global State (Redux)
```javascript
store/
├── slices/
│   ├── authSlice.js        # User authentication
│   ├── companySlice.js     # Company data
│   ├── uiSlice.js          # UI state (sidebar, modals)
│   └── notificationSlice.js # Toast notifications
├── api/                    # RTK Query API slices
│   ├── authApi.js
│   ├── companyApi.js
│   ├── technicianApi.js
│   ├── customerApi.js
│   ├── equipmentApi.js
│   ├── offerApi.js
│   ├── workOrderApi.js
│   ├── inspectionApi.js
│   └── reportApi.js
└── store.js               # Store configuration
```

### Auth State Structure
```javascript
{
  auth: {
    user: {
      id: 2,
      name: "Firma",
      surname: "Admin", 
      email: "admin@abc.com",
      permissions: ["companyAdmin", "viewTechnicians", ...],
      company_id: 1,
      company_name: "ABC Mühendislik A.Ş."
    },
    token: "jwt_token_here",
    isAuthenticated: true,
    isLoading: false
  }
}
```

### UI State Structure
```javascript
{
  ui: {
    sidebar: {
      isOpen: true,
      isCollapsed: false
    },
    modals: {
      deleteConfirm: false,
      editTechnician: false
    },
    theme: "light", // light | dark
    notifications: []
  }
}
```

### Theme Management
```javascript
// Theme context ve hooks
const ThemeContext = {
  theme: 'light', // 'light' | 'dark'
  toggleTheme: () => {},
  colors: {
    // Dynamic color values based on theme
    background: 'var(--bg-primary)',
    text: 'var(--text-primary)',
    border: 'var(--border-color)'
  }
}
```

## 🧩 Ana Component'ler

### 1. Layout Components

#### `AppLayout.jsx`
```javascript
// Ana layout wrapper
- Header (logo, user menu, notifications)
- Sidebar (navigation menu)
- Main content area
- Footer
- Mobile responsive
```

#### `Sidebar.jsx`
```javascript
// Navigation sidebar
- Permission-based menu items
- Collapsible design
- Active state management
- Mobile drawer
```

#### `Header.jsx`
```javascript
// Top header bar
- Company logo
- Breadcrumb navigation
- User dropdown menu
- Notification bell
- Mobile menu toggle
```

### 2. Common Components

#### `DataTable.jsx`
```javascript
// Reusable table component
- Sorting, filtering, pagination
- Selection checkboxes
- Action buttons (edit, delete)
- Loading states
- Empty states
```

#### `Modal.jsx`
```javascript
// Generic modal wrapper
- Backdrop click to close
- ESC key handling
- Focus management
- Animation transitions
```

#### `FormField.jsx`
```javascript
// Consistent form field
- Label, input, error message
- Various input types
- Validation state styling
```

### 3. Feature Components

#### `DynamicInspectionForm.jsx`
```javascript
// Dynamic form for inspections
- Renders based on equipment template
- Handles all field types:
  - text, number, date
  - select (dropdown)
  - table (dynamic rows)
  - photo upload
- Real-time validation
- Auto-save capability
```

#### `PermissionManager.jsx`
```javascript
// Permission assignment UI
- Checkbox grid for permissions
- Group by categories
- Search and filter
- Bulk operations
```

#### `QRCodeViewer.jsx`
```javascript
// QR code display
- Generate QR for reports
- Print functionality
- Download options
```

## 📄 Ana Sayfalar Detayı

### 1. Dashboard Sayfası (`/dashboard`)

#### Company Admin Dashboard
```javascript
// Layout: 3-column grid
- Statistics Cards (top row)
  - Total Offers, Work Orders, Inspections
  - Pending Actions, Completed This Month
- Charts (middle section)
  - Monthly inspection trends
  - Equipment type distribution
  - Technician workload
- Recent Activity (right sidebar)
  - Latest offers, work orders
  - Quick actions panel
```

#### Technician Dashboard  
```javascript
// Layout: 2-column grid
- My Tasks (left column)
  - Assigned work orders
  - Pending inspections
  - Today's schedule
- Quick Actions (right column)
  - Start inspection
  - Upload photos
  - View reports
```

### 2. Technician Management (`/technicians`)

#### Technician List Page
```javascript
// Features:
- Search by name, email
- Filter by permissions, status
- Pagination table
- Bulk actions (activate, deactivate)
- Add new technician button
```

#### Add/Edit Technician Form
```javascript
// Sections:
1. Personal Information
   - Name, surname, email, phone
   - Password (create only)
2. Permissions Management
   - Permission category grid
   - Search permissions
   - Select all/none options
3. Settings
   - Active/inactive status
   - E-signature PIN setup
```

### 3. Equipment Management (`/equipment`)

#### Equipment List
```javascript
// Features:
- Filter by equipment type
- Search by name
- Template preview
- Quick edit template
```

#### Template Editor
```javascript
// Dynamic template builder:
1. Section Management
   - Add/remove sections
   - Reorder sections
2. Field Editor per Section
   - Field types: text, number, date, select, table, photo
   - Field properties: name, label, required, options
   - Drag & drop reordering
3. Preview Mode
   - Live preview of inspection form
   - Test data entry
4. Validation
   - Template structure validation
   - Required field checking
```

### 4. Offer Management (`/offers`)

#### Offer List
```javascript
// Features:
- Status-based tabs (pending, approved, sent, viewed)
- Customer filter
- Date range filter
- Bulk actions (approve, send)
```

#### Create/Edit Offer
```javascript
// Form sections:
1. Customer Selection
   - Dropdown with search
   - Quick add customer option
2. Equipment Items
   - Add/remove equipment rows
   - Quantity, unit price, description
   - Auto-calculate totals
3. Additional Information
   - Notes
   - Terms and conditions
4. Actions
   - Save draft
   - Send for approval
```

### 5. Work Order Management (`/work-orders`)

#### Work Order Detail
```javascript
// Layout: Tabbed interface
1. Overview Tab
   - Basic information
   - Customer details
   - Status timeline
2. Technicians Tab
   - Assigned technicians
   - Assignment management
   - Workload distribution
3. Inspections Tab
   - Inspection list
   - Progress tracking
   - Quick actions
4. Documents Tab
   - Generated reports
   - Attachments
```

### 6. Inspection Form (`/inspections/:id/edit`)

#### Dynamic Inspection Form
```javascript
// Adaptive form based on equipment template:
1. Header Section
   - Equipment info
   - Technician info
   - Date/time range
2. Dynamic Sections (from template)
   - Render based on template.sections
   - Handle all field types
   - Real-time validation
3. Photo Upload Section
   - Multiple file upload
   - Image preview gallery
   - Organize by categories
4. Action Buttons
   - Save draft
   - Complete inspection
   - Generate report
```

### 7. Report Management (`/reports`)

#### Report Detail
```javascript
// Layout: Document viewer
1. Report Header
   - Basic info, status badges
   - Download, print, share options
2. PDF Viewer
   - Embedded PDF display
   - Zoom controls
   - Page navigation
3. Signature Section
   - E-signature status
   - Sign button (for authorized users)
   - Signature history
4. Actions Panel
   - Send to customer
   - Generate QR code
   - Archive report
```

## 🔐 Authentication & Authorization

### Login Flow
```javascript
1. User enters email/password
2. Form validation
3. API call to /api/auth/login
4. Store JWT token in localStorage
5. Store user data in Redux
6. Redirect to dashboard
7. Set up axios interceptor for token
```

### Permission System Integration
```javascript
// Custom hook for permission checking
const usePermission = (permission) => {
  const user = useSelector(state => state.auth.user);
  return user?.permissions?.includes(permission) || 
         user?.permissions?.includes('superAdmin');
};

// Usage in components
const CanCreateTechnician = ({ children }) => {
  const hasPermission = usePermission('createTechnician');
  return hasPermission ? children : null;
};
```

### Route Protection
```javascript
// ProtectedRoute component
const ProtectedRoute = ({ children, requiredPermission }) => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const hasPermission = usePermission(requiredPermission);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPermission && !hasPermission) {
    return <AccessDenied />;
  }
  
  return children;
};
```

## 🌐 API Integration

### API Service Layer
```javascript
// services/api.js - Base API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);
```

### RTK Query API Slices
```javascript
// store/api/technicianApi.js
export const technicianApi = createApi({
  reducerPath: 'technicianApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/technicians',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Technician'],
  endpoints: (builder) => ({
    getTechnicians: builder.query({
      query: () => '',
      providesTags: ['Technician']
    }),
    createTechnician: builder.mutation({
      query: (technician) => ({
        url: '',
        method: 'POST',
        body: technician
      }),
      invalidatesTags: ['Technician']
    }),
    updateTechnician: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: patch
      }),
      invalidatesTags: ['Technician']
    })
  })
});
```

## 📱 Mobile Responsiveness

### Breakpoint Strategy
```javascript
// Tailwind CSS breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
```

### Mobile-First Approach
```javascript
// Component responsive patterns
<div className="
  grid grid-cols-1       // Mobile: single column
  md:grid-cols-2         // Tablet: two columns  
  lg:grid-cols-3         // Desktop: three columns
">

// Sidebar responsive behavior
<aside className="
  fixed inset-y-0 left-0 z-50 w-64    // Mobile: overlay
  transform -translate-x-full          // Hidden by default
  lg:translate-x-0                     // Desktop: always visible
  lg:static lg:inset-0                 // Desktop: in document flow
">
```

### Touch-Friendly Design
- Minimum 44px touch targets
- Swipe gestures for mobile tables
- Pull-to-refresh capability
- Optimized form inputs for mobile keyboards

## 🚀 Performance Optimization

### Code Splitting
```javascript
// Lazy load feature components
const Dashboard = lazy(() => import('../features/dashboard/Dashboard'));
const Technicians = lazy(() => import('../features/technicians/TechnicianList'));

// Route-based code splitting
<Route path="/dashboard" element={
  <Suspense fallback={<PageSkeleton />}>
    <Dashboard />
  </Suspense>
} />
```

### Caching Strategy
```javascript
// RTK Query caching
- Keep fresh data for 60 seconds
- Background refetch on focus
- Optimistic updates for mutations
- Infinite scrolling for large lists
```

### Image Optimization
```javascript
// Progressive image loading
- Placeholder → Low quality → High quality
- WebP format with fallbacks
- Lazy loading for images
- Image compression for uploads
```

## 🧪 Development Workflow

### Environment Setup
```javascript
// .env files
.env.local              # Local development
.env.development        # Development server
.env.production         # Production build

// Environment variables
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_UPLOAD_URL=http://localhost:3000/api/uploads
REACT_APP_ESIGNER_URL=http://localhost:8080
```

### Development Scripts
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build", 
    "test": "react-scripts test",
    "analyze": "npm run build && npx bundle-analyzer build/static/js/*.js"
  }
}
```

### Code Quality
```javascript
// ESLint + Prettier configuration
- Airbnb React style guide
- Automatic formatting on save
- Pre-commit hooks with Husky
- Component PropTypes validation
```

## 📋 Özellik Roadmap

### Phase 1: Core Features (İlk Sprint)
- ✅ Authentication system
- ✅ Dashboard layouts
- ✅ Technician management
- ✅ Basic navigation

### Phase 2: Business Logic (İkinci Sprint)
- ✅ Customer management
- ✅ Equipment management
- ✅ Offer creation and management
- ✅ Work order management

### Phase 3: Inspection & Reports (Üçüncü Sprint)
- ✅ Dynamic inspection forms
- ✅ Photo upload system
- ✅ Report generation
- ✅ E-signature integration

### Phase 4: Advanced Features (Dördüncü Sprint)
- ✅ Advanced filtering and search
- ✅ Bulk operations
- ✅ Email notifications
- ✅ Calendar integration

### Phase 5: Polish & Performance (Son Sprint)
- ✅ Performance optimization
- ✅ Mobile responsiveness
- ✅ Accessibility improvements
- ✅ User testing and fixes

## 🎯 Success Metrics

### User Experience
- Page load time < 2 seconds
- Mobile-friendly score > 90
- Accessibility score > 90
- User task completion rate > 95%

### Technical Metrics
- Bundle size < 500KB (gzipped)
- First Contentful Paint < 1.5s
- Lighthouse Performance Score > 90
- Zero runtime errors in production

## 📝 Notlar

### API Entegrasyonu
- Backend'de 60+ endpoint hazır
- Authentication JWT ile çalışıyor
- Permission-based authorization var
- Error handling tutarlı format

### Dikkat Edilmesi Gerekenler
- Multi-tenant yapı (company_id isolation)
- Dynamic template system (JSONB)
- E-signature local client entegrasyonu
- QR code generation ve tracking
- File upload ve serving güvenliği
- Real-time inspection time slot validation

### Frontend-Backend Uyumu
- API response formatları tutarlı
- Permission system tam uyumlu
- File upload/download endpoints hazır
- Error code'lar standardize edilmiş

---

Bu planlamanın ardından frontend development'a başlayabiliriz. Her feature için ayrı component'ler oluşturup, backend API'lerini entegre ederek tam işlevsel bir muayene ve raporlama sistemi oluşturacağız.

🚀 **Sıradaki Adım**: Frontend development environment kurulumu ve ilk component'lerin oluşturulması!