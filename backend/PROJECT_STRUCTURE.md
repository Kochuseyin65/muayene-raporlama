# Muayene ve Raporlama Sistemi - Backend Proje Yapısı

Bu dokümantasyon, projenin tüm dosya yapısını ve her bir bileşenin işlevini detaylı olarak açıklar. Yeni geliştiricilerin projeyi hızla anlaması için hazırlanmıştır.

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Mimari Yaklaşım](#mimari-yaklaşım)
4. [Klasör Yapısı](#klasör-yapısı)
5. [Dosya Detayları](#dosya-detayları)
6. [Veri Akışı](#veri-akışı)
7. [Geliştirici Notları](#geliştirici-notları)

## 🎯 Proje Genel Bakış

### Ne Yapar?
Mühendislik firmalarının muayene ve raporlama süreçlerini dijitalleştiren kapsamlı bir backend sistemi.

### Temel İşlevler
- **Multi-tenant Architecture**: Her firma kendi verilerini yönetir
- **Teklif → İş Emri → Muayene → Rapor** akışı
- **Dynamic Template System**: Ekipman bazlı esnek muayene şablonları
- **E-signature Integration**: Client-side e-imza entegrasyonu
- **PDF Report Generation**: HTML'den otomatik PDF üretimi
- **Permission-based Authorization**: Granular yetki sistemi
- **File Upload Management**: Güvenli dosya yönetimi
- **QR Code Tracking**: Rapor doğrulama sistemi

### İş Akışı
```
Müşteri → Teklif Oluştur → Onayla → İş Emri → Teknisyen Ata → 
Muayene Yap → Rapor Oluştur → E-İmza → Müşteriye Gönder
```

## 🛠 Teknoloji Stack

### Backend Framework
- **Node.js**: JavaScript runtime
- **Express.js 4.x**: Web framework (downgraded for routing compatibility)
- **PostgreSQL**: İlişkisel veritabanı

### Güvenlik
- **JWT**: Token-based authentication
- **bcryptjs**: Şifre hashleme
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting

### Dosya İşleme
- **Multer**: File upload middleware
- **html-pdf**: PDF generation
- **crypto**: Token/hash generation

### Validation & Utilities
- **express-validator**: Input validation
- **Morgan**: HTTP request logger
- **dotenv**: Environment variables

## 🏗 Mimari Yaklaşım

### Design Patterns
- **MVC Architecture**: Model-View-Controller separation
- **Middleware Pattern**: Request/response pipeline
- **Repository Pattern**: Database abstraction (implicit)
- **Factory Pattern**: Token/PDF generation

### Database Approach
- **Raw SQL**: Direct PostgreSQL queries (no ORM)
- **Connection Pooling**: pg connection pool
- **Migration System**: SQL-based schema management
- **JSONB Storage**: Dynamic data (templates, inspection data)

### Security Model
- **Permission-based**: Granular authorization
- **Multi-tenant**: Company-level data isolation
- **Token-based Auth**: Stateless authentication
- **Input Validation**: All inputs validated

## 📁 Klasör Yapısı

```
backend/
├── config/                 # Konfigürasyon dosyaları
│   ├── database.js         # Veritabanı bağlantı ayarları
│   └── migrations/         # Veritabanı migration dosyaları
├── controllers/            # İş mantığı ve request handling
├── middleware/             # Express middleware'ları
├── models/                 # Veri modelleri (boş - raw SQL kullanıyor)
├── routes/                 # API route tanımları
├── utils/                  # Yardımcı fonksiyonlar
├── uploads/                # Yüklenen dosyalar (runtime'da oluşur)
├── app.js                  # Ana Express uygulama dosyası
├── package.json            # NPM dependencies ve scripts
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
└── README.md              # Proje açıklaması
```

## 📄 Dosya Detayları

### 🗂 Root Dosyalar

#### `app.js` - Ana Uygulama Dosyası
**Görev**: Express uygulamasının merkezi konfigürasyonu
```javascript
// Temel Express setup
// Security middleware'leri (helmet, cors)
// Rate limiting konfigürasyonu
// Route'ları mount etme
// Error handling
// Server başlatma
```

**Önemli Özellikler**:
- Farklı endpoint'ler için farklı rate limit'ler
- Global error handler
- CORS policy
- JSON body parsing (10MB limit)
- Helmet security headers

#### `package.json` - NPM Konfigürasyonu
**Görev**: Proje metadata'sı ve dependency yönetimi
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "migrate": "node utils/migrate.js"
  }
}
```

**Dependencies**:
- **Production**: Express, PostgreSQL, JWT, validation
- **Development**: Nodemon

#### `.env` - Environment Variables
**Görev**: Konfigürasyon değerleri
```
PORT=3000
DB_HOST=localhost
DB_NAME=muayene_db
JWT_SECRET=your-secret-key
```

#### `.gitignore` - Git Ignore Rules
**Görev**: Version control'dan hariç tutulacak dosyalar
- node_modules/
- .env files
- uploads/ (runtime files)
- logs/

### 🔧 config/ - Konfigürasyon Klasörü

#### `config/database.js` - Veritabanı Bağlantısı
**Görev**: PostgreSQL connection pool yönetimi
```javascript
// pg.Pool konfigürasyonu
// Connection parameters (.env'den)
// Connection events (connect, error)
// Pool export
```

**Özellikler**:
- Max 20 connection
- 30s idle timeout
- 2s connection timeout
- Error ve success event'leri

#### `config/migrations/` - Database Migration'ları

##### `001_create_tables.sql` - Tablo Oluşturma
**Görev**: Tüm veritabanı tablolarını oluşturur
```sql
-- Companies (muayene firmaları)
-- Technicians (teknisyenler) 
-- Customer_companies (müşteri firmaları)
-- Equipment (ekipmanlar)
-- Offers (teklifler)
-- Work_orders (iş emirleri)
-- Work_order_assignments (atamalar)
-- Inspections (muayeneler)
-- Reports (raporlar)
```

**Önemli Noktalar**:
- Foreign key relationships
- JSONB columns (templates, inspection data)
- Indexes for performance
- Triggers for updated_at
- Unique constraints (time slots, tax numbers)

##### `002_seed_data.sql` - Örnek Veri
**Görev**: Development için başlangıç verilerini oluşturur
```sql
-- Sample company
-- Admin users (super admin, company admin)
-- Sample technician
-- Sample customer company  
-- Sample equipment templates (Kule Vinç, Basınçlı Hava Tankı)
```

**Default Users**:
- superadmin@abc.com (Super Admin)
- admin@abc.com (Company Admin)
- ahmet@abc.com (Technician)
- Password: "password" (hashed)

### 🎮 controllers/ - Controller Klasörü

#### `authController.js` - Authentication Controller
**Görev**: Kimlik doğrulama işlemleri
```javascript
// login() - Kullanıcı girişi
// logout() - Çıkış
// getProfile() - Profil bilgileri
// checkPermission() - Yetki kontrolü
// generateToken() - JWT oluşturma
```

**Özellikler**:
- bcrypt şifre doğrulama
- JWT token generation
- User data sanitization
- Permission checking

#### `companyController.js` - Firma Yönetimi
**Görev**: Muayene firmalarının CRUD işlemleri
```javascript
// getAllCompanies() - Tüm firmalar (Super Admin)
// getCompany() - Firma detayı
// getCompanyProfile() - Mevcut kullanıcının firma profili [YENİ EKLENDİ]
// createCompany() - Yeni firma
// updateCompany() - Firma güncelleme
// deleteCompany() - Firma silme
```

**İş Mantığı**:
- Super admin tüm firmaları yönetebilir
- Company admin sadece kendi firmasını
- Tax number uniqueness kontrolü
- Dependency check before delete
- **[YENİ]** Profile endpoint authentication token'dan company_id çekerek çalışır

#### `technicianController.js` - Teknisyen Yönetimi
**Görev**: Teknisyen CRUD ve yetki yönetimi
```javascript
// getTechnicians() - Teknisyen listesi
// createTechnician() - Yeni teknisyen
// updateTechnician() - Bilgi güncelleme
// updateTechnicianPermissions() - Yetki güncelleme
// updateTechnicianPassword() - Şifre değiştirme
// deleteTechnician() - Teknisyen silme (soft delete if has data)
```

**Özellikler**:
- Password hashing
- Permission array management
- Email uniqueness kontrolü
- Soft delete for data integrity

#### `customerCompanyController.js` - Müşteri Firma Yönetimi
**Görev**: Müşteri firmalarının yönetimi
```javascript
// getCustomerCompanies() - Pagination, search
// createCustomerCompany() - Yeni müşteri
// updateCustomerCompany() - Güncelleme
// deleteCustomerCompany() - Silme (dependency check)
```

**Özellikler**:
- Search functionality (name, tax number, email)
- Pagination support
- Email/tax number uniqueness per company
- Dependency validation

#### `equipmentController.js` - Ekipman Yönetimi
**Görev**: Ekipman ve dinamik şablon yönetimi
```javascript
// getEquipment() - Ekipman listesi (filtering, pagination)
// getEquipmentTypes() - Distinct türler
// createEquipment() - Yeni ekipman ve şablon
// updateEquipment() - Ekipman güncelleme
// updateEquipmentTemplate() - Sadece şablon güncelleme
// validateTemplate() - Şablon structure validation
```

**Template Validation**:
- JSON structure kontrolü
- Required sections ve fields
- Field type validation (text, number, date, select, table, photo)
- Options validation for select fields
- Columns validation for table fields

#### `offerController.js` - Teklif Yönetimi
**Görev**: İş tekliflerinin yaşam döngüsü
```javascript
// getOffers() - Filtering, pagination
// createOffer() - Yeni teklif (items validation)
// updateOffer() - Teklif güncelleme
// approveOffer() - Teklif onaylama
// sendOffer() - Email gönderme (tracking token)
// trackOffer() - Public tracking (QR/URL)
// convertToWorkOrder() - İş emrine dönüştürme
// deleteOffer() - Teklif silme
```

**İş Akışı**:
1. pending → approved → sent → viewed
2. Equipment validation ve price calculation
3. Tracking token generation
4. Work order creation with inspections

#### `workOrderController.js` - İş Emri Yönetimi
**Görev**: İş emirleri ve teknisyen atamaları
```javascript
// getWorkOrders() - Complex queries (assigned technicians)
// createWorkOrder() - İş emri + inspections creation
// updateWorkOrder() - Basic info update
// assignTechnicians() - Teknisyen atama/değiştirme
// updateWorkOrderStatus() - Durum yönetimi
// deleteWorkOrder() - Cascade delete with validations
```

**Özellikler**:
- Transaction management
- Automatic inspection creation
- Technician assignment management
- Status workflow validation
- Cascade delete with safety checks

#### `inspectionController.js` - Muayene Yönetimi
**Görev**: Muayene işlemleri ve validation
```javascript
// getInspections() - Multi-filter queries
// getInspection() - Muayene detayı
// createInspection() - Yeni muayene oluşturma [YENİ EKLENDİ]
// updateInspection() - Data + time slot validation
// saveInspection() - Report generation trigger
// completeInspection() - Completion validation
// uploadInspectionPhotos() - File handling
// checkTimeSlotAvailability() - Conflict checking
// validateInspectionCompletion() - Template validation
// createInspectionValidation - Validation middleware [YENİ EKLENDİ]
```

**Time Slot Management**:
- Technician conflict checking
- Date/time validation
- Overlap detection
- **[YENİ]** Manuel inspection creation with full validation

**Template Integration**:
- Dynamic data validation
- Required field checking
- Photo URL management

**[YENİ] Manual Inspection Creation**:
- Work order, equipment, technician validation
- Time slot availability checking
- Company data isolation
- Full CRUD support for inspections

#### `reportController.js` - Rapor Yönetimi
**Görev**: PDF generation ve e-imza işlemleri
```javascript
// getReport() - Rapor detayları
// downloadReport() - PDF serving (signed/unsigned)
// signReport() - E-imza işlemi
// sendReport() - Email gönderme
// getPublicReport() - QR code access
// getSigningData() - E-imza için data
// generateReportHTML() - Template rendering
// generatePDFFromHTML() - PDF conversion
```

**PDF Generation Pipeline**:
1. Template + inspection data → HTML
2. HTML → PDF (html-pdf library)
3. Base64 storage in database
4. E-signature integration

#### `uploadController.js` - Dosya Yükleme
**Görev**: Dosya upload ve serving işlemleri
```javascript
// uploadCompanyLogo() - Firma logosu
// uploadInspectionPhotos() - Muayene fotoğrafları
// deleteInspectionPhoto() - Fotoğraf silme
// getUploadedFile() - File serving with security
```

**Security Features**:
- Path traversal protection
- File type validation
- Size limits
- Permission-based access

### 🔒 middleware/ - Middleware Klasörü

#### `auth.js` - Authentication Middleware
**Görev**: JWT token doğrulama ve user context
```javascript
// Token extraction (Bearer header)
// JWT verification
// User data fetch from database
// Request object'e user bilgisi ekleme
// Error handling (expired, invalid tokens)
```

**Request Flow**:
```
Request → Extract Token → Verify JWT → Fetch User → req.user = userData → Next()
```

#### `permissions.js` - Authorization Middleware
**Görev**: Permission-based access control
```javascript
// PERMISSIONS constant - Tüm permission'lar
// requirePermission() - Single permission check
// requireAnyPermission() - Multiple permission check (OR)
// checkPermission() - Utility function
```

**Permission Logic**:
- Super admin bypass (all permissions)
- User permission array kontrolü
- Granular access control
- Error responses with details

#### `upload.js` - File Upload Middleware
**Görev**: Multer konfigürasyonu ve file handling
```javascript
// logoStorage - Company logo storage config
// inspectionPhotoStorage - Inspection photo config
// imageFileFilter - File type validation
// uploadLogo - Single file upload
// uploadInspectionPhotos - Multiple file upload
// handleUploadError - Error handling
```

**Storage Strategy**:
- Organized directory structure
- Unique filename generation
- File type restrictions
- Size limits per upload type

### 🛤 routes/ - Routes Klasörü

#### Route Dosyaları
Her controller için ayrı route dosyası:

##### `auth.js` - Authentication Routes
```javascript
// POST /login - Giriş
// POST /logout - Çıkış  
// GET /profile - Profil
// GET /check-permission/:permission - Yetki kontrolü
```

##### `companies.js` - Company Routes
```javascript
// GET / - List (Super Admin)
// GET /profile - Current company profile [YENİ EKLENDİ]
// GET /:id - Detail
// POST / - Create (Super Admin)
// PUT /:id - Update
// DELETE /:id - Delete (Super Admin)
```

##### `technicians.js` - Technician Routes
```javascript
// GET / - List
// GET /:id - Detail
// POST / - Create
// PUT /:id - Update
// PUT /:id/permissions - Update permissions
// PUT /:id/password - Change password
// DELETE /:id - Delete
```

##### `customerCompanies.js` - Customer Routes
```javascript
// GET / - List (pagination, search)
// GET /:id - Detail
// POST / - Create
// PUT /:id - Update
// DELETE /:id - Delete
```

##### `equipment.js` - Equipment Routes
```javascript
// GET / - List (pagination, filtering)
// GET /types - Get equipment types
// GET /:id - Detail
// POST / - Create
// PUT /:id - Update
// PUT /:id/template - Update template only
// DELETE /:id - Delete
```

##### `offers.js` - Offer Routes
```javascript
// GET / - List (filtering, pagination)
// GET /track/:token - Public tracking
// GET /:id - Detail
// POST / - Create
// PUT /:id - Update
// POST /:id/approve - Approve
// POST /:id/send - Send to customer
// POST /:id/convert-to-work-order - Convert
// DELETE /:id - Delete
```

##### `workOrders.js` - Work Order Routes
```javascript
// GET / - List (complex filtering)
// GET /:id - Detail (with inspections)
// POST / - Create
// PUT /:id - Update
// PUT /:id/assign - Assign technicians
// PUT /:id/status - Update status
// DELETE /:id - Delete
```

##### `inspections.js` - Inspection Routes
```javascript
// GET / - List (multi-filtering)
// GET /check-availability - Time slot check
// POST / - Create new inspection [YENİ EKLENDİ]
// GET /:id - Detail (with template)
// PUT /:id - Update data
// POST /:id/save - Save (generate report)
// POST /:id/complete - Complete
// POST /:id/photos - Upload photos
```

##### `reports.js` - Report Routes
```javascript
// GET /public/:qrToken - Public access
// GET /:id - Detail
// GET /:id/download - Download PDF
// GET /:id/signing-data - Get signing data
// POST /:id/sign - E-signature
// POST /:id/send - Send to customer
```

##### `uploads.js` - Upload Routes
```javascript
// POST /company-logo - Upload logo
// POST /inspection-photos/:inspectionId - Upload photos
// DELETE /inspection-photos/:inspectionId/:filename - Delete photo
// GET /:type/* - Serve files
```

**Route Patterns**:
- RESTful design
- Consistent middleware application
- Permission-based access control
- Validation middleware integration

### 🔧 utils/ - Utilities Klasörü

#### `migrate.js` - Migration Utility
**Görev**: Database schema management
```javascript
// runMigrations() - SQL file'ları sırayla çalıştır
// testConnection() - Database connectivity test
// Migration file discovery
// Transaction management
// Error handling ve rollback
```

**Migration Flow**:
1. Scan migrations directory
2. Sort files alphabetically
3. Execute SQL files in order
4. Handle errors with rollback
5. Success logging

### 📁 models/ - Models Klasörü (Boş)
**Neden Boş?**: 
- Raw SQL approach kullanılıyor
- ORM kullanılmıyor (Sequelize, Prisma vs.)
- Database queries controller'larda direkt yapılıyor
- JSONB ile flexible data storage

**Alternatif Yaklaşımlar**:
- Sequelize models eklenebilir
- Prisma schema kullanılabilir
- TypeORM entities oluşturulabilir

### 📤 uploads/ - Upload Klasörü (Runtime)
**Görev**: Yüklenen dosyaların saklanması
```
uploads/
├── logos/              # Company logos
│   └── company_1_1640995200000.png
└── inspections/        # Inspection photos
    └── 123/           # Inspection ID
        ├── inspection_1640995200000_abc123.jpg
        └── inspection_1640995200001_def456.jpg
```

**Özellikler**:
- Organized by type and ID
- Unique filename generation
- Automatic directory creation
- Secure file serving

## 🔄 Veri Akışı

### Authentication Flow
```
1. Client → POST /api/auth/login (email, password)
2. authController.login() → bcrypt.compare()
3. Generate JWT token
4. Return token + user data
5. Client stores token
6. Future requests → Authorization: Bearer {token}
7. authMiddleware → verify token → req.user
8. Route handler → permission check → business logic
```

### Business Process Flow
```
1. Create Customer Company
2. Create Offer (with equipment items)
3. Approve Offer
4. Send Offer (email tracking)
5. Convert to Work Order
6. Assign Technicians
7. Perform Inspections (time slot validation)
8. Save Inspection (generate report)
9. Complete Inspection
10. Sign Report (e-signature)
11. Send Report to Customer
```

### File Upload Flow
```
1. Client → multipart/form-data
2. Multer middleware → file validation
3. Storage configuration → organized saving
4. Database URL update
5. Success response with file info
6. File serving via GET /uploads/:type/*
```

### Permission Check Flow
```
1. Request with auth token
2. authMiddleware → extract user
3. Route → requirePermission(permission)
4. Check user.permissions array
5. Super admin bypass OR permission match
6. Allow/deny request
```

## 🧠 Geliştirici Notları

### Önemli Design Decisions

#### 1. Raw SQL vs ORM
**Tercih**: Raw SQL
**Neden**: 
- Performance (no overhead)
- Complex queries kontrolü
- Learning curve azlığı
- JSONB flexibility

#### 2. Permission-based vs Role-based
**Tercih**: Permission-based
**Neden**:
- Granular control
- Flexible authorization
- Easy permission management
- Business requirement match

#### 3. Base64 PDF Storage
**Tercih**: Database storage
**Neden**:
- Backup kolaylığı
- Version control
- Transaction safety
- Cloud deployment uyumluluğu

#### 4. Multi-tenant Architecture
**Tercih**: Shared database, company_id isolation
**Neden**:
- Cost effective
- Maintenance kolaylığı
- Data isolation güvenliği
- Scalability

### Code Conventions

#### Naming
- **Files**: camelCase (technicianController.js)
- **Functions**: camelCase (getTechnicians)
- **Database**: snake_case (company_id)
- **API**: kebab-case (/customer-companies)

#### Error Handling
```javascript
// Consistent error format
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly message',
    details: 'Technical details'
  }
}
```

#### Response Format
```javascript
// Success response
{
  success: true,
  data: { /* response data */ },
  message: 'Optional success message'
}

// Pagination response
{
  success: true,
  data: {
    items: [/* data array */],
    pagination: {
      currentPage: 1,
      totalPages: 10,
      totalCount: 200,
      hasNext: true,
      hasPrev: false
    }
  }
}
```

### Security Considerations

#### Input Validation
- express-validator her endpoint'te
- SQL injection prevention (parameterized queries)
- File type/size validation
- XSS prevention

#### Authentication & Authorization
- JWT token expiration
- Permission granularity
- Company data isolation
- Rate limiting

#### File Security
- Path traversal prevention
- File type restrictions
- Size limitations
- Secure serving

### Performance Optimizations

#### Database
- Connection pooling
- Proper indexing
- Query optimization
- JSONB indexing

#### API
- Pagination
- Filtering
- Rate limiting
- Response compression

### Monitoring & Logging

#### Request Logging
- Morgan HTTP logger
- Error stack traces
- Database query logging

#### Health Checks
- GET /api/health endpoint
- Database connectivity check
- Uptime monitoring ready

### Deployment Considerations

#### Environment Variables
- Database credentials
- JWT secrets
- File upload paths
- API rate limits

#### Production Requirements
- PostgreSQL instance
- File storage solution
- SSL/TLS setup
- Process management (PM2)

#### Scaling
- Database read replicas
- File storage (AWS S3)
- Load balancing
- Microservice splitting

### Testing Strategy (Gelecek)
- Unit tests (controllers)
- Integration tests (API endpoints)
- Database tests (migrations)
- File upload tests

### Recent Updates (Ağustos 2025)

#### 🔧 Bug Fixes & Improvements
1. **Express.js Downgrade**: 5.x → 4.x routing compatibility sorunu çözüldü
2. **Company Profile Endpoint**: `/api/companies/profile` endpoint eklendi
3. **Manual Inspection Creation**: POST `/api/inspections` endpoint implement edildi
4. **Full CRUD Completion**: Tüm modüller için eksik CRUD endpoint'ler tamamlandı

#### 📋 Added Features
- **Enhanced Company Management**: Profile endpoint with token-based company detection
- **Complete Inspection CRUD**: Manual inspection creation with validation
- **Improved Error Handling**: Consistent error responses across all endpoints
- **Route Conflict Resolution**: Company profile route positioning fixed

#### 🧪 Testing & Validation
- **Full Business Flow**: Teklif → İş Emri → Muayene → Rapor akışı test edildi
- **Time Slot Validation**: Conflict detection ve availability check doğrulandı
- **Permission System**: Granular authorization test edildi
- **Error Scenarios**: 404, 403, 409 error handling test edildi

### Future Improvements
1. **ORM Integration**: Sequelize/Prisma ekleme
2. **Caching**: Redis integration
3. **Email Service**: SendGrid/AWS SES
4. **File Storage**: Cloud storage migration
5. **Real-time**: WebSocket notifications
6. **API Documentation**: Swagger/OpenAPI
7. **Monitoring**: APM tools
8. **Testing**: Comprehensive test suite

---

Bu dokümantasyon ile yeni geliştiriciler projeyi hızla anlayabilir ve katkıda bulunmaya başlayabilir. Her dosyanın amacı, ilişkileri ve iş mantığı detaylı olarak açıklanmıştır.