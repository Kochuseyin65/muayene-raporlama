# Muayene ve Raporlama Sistemi - Backend

Bu proje, mühendislik firmalarının muayene ve raporlama süreçlerini dijitalleştiren kapsamlı bir backend sistemidir.

## Özellikler

- **Multi-tenant Architecture**: Her firma kendi verilerini bağımsız olarak yönetir
- **Permission-based Authorization**: Esnek yetki yönetimi sistemi
- **Dynamic Template System**: Ekipman bazlı dinamik muayene şablonları
- **PDF Report Generation**: HTML'den PDF'e otomatik rapor üretimi
- **E-signature Integration**: Client-side e-imza entegrasyonu
- **File Upload Management**: Güvenli dosya yükleme ve yönetimi
- **QR Code Tracking**: Rapor doğrulama ve takip sistemi
- **Email Integration Ready**: E-posta gönderimi için hazır altyapı

## Teknolojiler

- **Backend**: Node.js + Express.js 4.x
- **Database**: PostgreSQL
- **Authentication**: JWT
- **File Upload**: Multer
- **PDF Generation**: html-pdf
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## Kurulum

### Gereksinimler
- **Node.js** >= 18.0.0
- **PostgreSQL** >= 13.0
- **npm** >= 8.0.0

### 1. Bağımlılıkları yükleyin:
```bash
npm install
```

### 2. PostgreSQL Kurulumu:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows - PostgreSQL resmi sitesinden indirin
```

### 3. Veritabanı oluşturun:
```bash
# PostgreSQL'e bağlanın
sudo -u postgres psql

# Veritabanı ve kullanıcı oluşturun
CREATE DATABASE muayene_db;
CREATE USER muayene_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE muayene_db TO muayene_user;
\q
```

### 4. Environment dosyasını oluşturun:
`.env` dosyası oluşturun ve aşağıdaki değerleri girin:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muayene_db
DB_USER=muayene_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# PDF Generation
PDF_OPTIONS={"format":"A4","border":"10mm"}
```

### 5. Migration'ları çalıştırın:
```bash
# Schema oluştur
psql -h localhost -U muayene_user -d muayene_db -f config/migrations/001_create_tables.sql

# Test verilerini yükle
psql -h localhost -U muayene_user -d muayene_db -f config/migrations/002_seed_data.sql
```

### 6. Sunucuyu başlatın:
```bash
# Geliştirme modu
npm start

# Production modu
NODE_ENV=production npm start
```

### 7. Test edin:
```bash
# API sağlık kontrolü
curl http://localhost:3000/api/health

# Test kullanıcısı ile giriş
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abc.com","password":"password"}'
```

## Test Kullanıcıları

Migration sonrası aşağıdaki test kullanıcıları hazır:

- **Super Admin**: `superadmin@abc.com` / `password`
- **Company Admin**: `admin@abc.com` / `password`  
- **Technician**: `ahmet@abc.com` / `password`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/profile` - Profil bilgileri
- `GET /api/auth/check-permission/:permission` - Yetki kontrolü

### Companies (Muayene Firmaları)
- `GET /api/companies` - Tüm firmalar (Super Admin)
- `GET /api/companies/profile` - Mevcut firma profili 🆕
- `GET /api/companies/:id` - Firma detayı
- `POST /api/companies` - Firma oluştur (Super Admin)
- `PUT /api/companies/:id` - Firma güncelle
- `DELETE /api/companies/:id` - Firma sil (Super Admin)

### Technicians (Teknisyenler)
- `GET /api/technicians` - Teknisyen listesi
- `GET /api/technicians/:id` - Teknisyen detayı
- `POST /api/technicians` - Teknisyen oluştur
- `PUT /api/technicians/:id` - Teknisyen güncelle
- `PUT /api/technicians/:id/permissions` - Yetkileri güncelle
- `PUT /api/technicians/:id/password` - Şifre güncelle
- `DELETE /api/technicians/:id` - Teknisyen sil

### Customer Companies (Müşteri Firmaları)
- `GET /api/customer-companies` - Müşteri firma listesi
- `GET /api/customer-companies/:id` - Müşteri firma detayı
- `POST /api/customer-companies` - Müşteri firma oluştur
- `PUT /api/customer-companies/:id` - Müşteri firma güncelle
- `DELETE /api/customer-companies/:id` - Müşteri firma sil

### Equipment (Ekipmanlar)
- `GET /api/equipment` - Ekipman listesi
- `GET /api/equipment/types` - Ekipman türleri
- `GET /api/equipment/:id` - Ekipman detayı
- `POST /api/equipment` - Ekipman oluştur
- `PUT /api/equipment/:id` - Ekipman güncelle
- `PUT /api/equipment/:id/template` - Şablon güncelle
- `DELETE /api/equipment/:id` - Ekipman sil

### Offers (Teklifler)
- `GET /api/offers` - Teklif listesi
- `GET /api/offers/:id` - Teklif detayı
- `GET /api/offers/track/:token` - Teklif takip (Public)
- `POST /api/offers` - Teklif oluştur
- `PUT /api/offers/:id` - Teklif güncelle
- `POST /api/offers/:id/approve` - Teklif onayla
- `POST /api/offers/:id/send` - Teklif gönder
- `POST /api/offers/:id/convert-to-work-order` - İş emrine dönüştür
- `DELETE /api/offers/:id` - Teklif sil

### Work Orders (İş Emirleri)
- `GET /api/work-orders` - İş emri listesi
- `GET /api/work-orders/:id` - İş emri detayı
- `POST /api/work-orders` - İş emri oluştur
- `PUT /api/work-orders/:id` - İş emri güncelle
- `PUT /api/work-orders/:id/assign` - Teknisyen ata
- `PUT /api/work-orders/:id/status` - Durum güncelle
- `DELETE /api/work-orders/:id` - İş emri sil

### Inspections (Muayeneler)
- `GET /api/inspections` - Muayene listesi
- `GET /api/inspections/check-availability` - Saat kontrolü
- `GET /api/inspections/:id` - Muayene detayı
- `POST /api/inspections` - Muayene oluştur 🆕
- `PUT /api/inspections/:id` - Muayene güncelle
- `POST /api/inspections/:id/save` - Muayene kaydet
- `POST /api/inspections/:id/complete` - Muayene tamamla
- `POST /api/inspections/:id/photos` - Fotoğraf yükle

### Reports (Raporlar)
- `GET /api/reports/:id` - Rapor detayı
- `GET /api/reports/:id/download` - Rapor indir
- `GET /api/reports/:id/signing-data` - İmzalama verisi
- `POST /api/reports/:id/sign` - Rapor imzala
- `POST /api/reports/:id/send` - Rapor gönder
- `GET /api/reports/public/:qrToken` - Public rapor görünümü

### Uploads (Dosya Yükleme)
- `POST /api/uploads/company-logo` - Firma logosu yükle
- `POST /api/uploads/inspection-photos/:inspectionId` - Muayene fotoğrafı yükle
- `DELETE /api/uploads/inspection-photos/:inspectionId/:filename` - Fotoğraf sil
- `GET /api/uploads/:type/*` - Dosya serve et

## Permission Sistemi

Sistem role-based değil, permission-based çalışır. Her kullanıcıya aşağıdaki yetkilerden gerekli olanlar atanır:

### Company Management
- `companyAdmin` - Firma yönetimi
- `superAdmin` - Sistem yönetimi

### User Management
- `viewTechnicians` - Teknisyenleri görüntüle
- `createTechnician` - Teknisyen oluştur
- `editTechnician` - Teknisyen düzenle
- `deleteTechnician` - Teknisyen sil

### Customer Management
- `viewCustomers` - Müşterileri görüntüle
- `createCustomer` - Müşteri oluştur
- `editCustomer` - Müşteri düzenle

### Equipment Management
- `viewEquipment` - Ekipmanları görüntüle
- `createEquipment` - Ekipman oluştur
- `editEquipment` - Ekipman düzenle

### Offer Management
- `viewOffers` - Teklifleri görüntüle
- `createOffer` - Teklif oluştur
- `editOffer` - Teklif düzenle
- `approveOffer` - Teklif onayla
- `sendOffer` - Teklif gönder

### Work Order Management
- `viewWorkOrders` - İş emirlerini görüntüle
- `createWorkOrder` - İş emri oluştur
- `editWorkOrder` - İş emri düzenle
- `assignWorkOrder` - İş emri ata
- `updateWorkOrderStatus` - İş emri durumu güncelle

### Inspection Management
- `viewInspections` - Muayeneleri görüntüle
- `editInspection` - Muayene düzenle
- `saveInspection` - Muayene kaydet
- `completeInspection` - Muayene tamamla
- `uploadPhotos` - Fotoğraf yükle

### Report Management
- `viewReports` - Raporları görüntüle
- `downloadReports` - Rapor indir
- `signReports` - Rapor imzala
- `sendReports` - Rapor gönder

### Dashboard & Calendar
- `viewDashboard` - Dashboard görüntüle
- `viewCalendar` - Takvim görüntüle

## Dinamik Şablon Sistemi

Ekipmanlar için JSON formatında dinamik şablonlar kullanılır:

```json
{
  "sections": [
    {
      "title": "Genel Bilgiler",
      "fields": [
        {
          "name": "muayene_tarihi",
          "type": "date",
          "label": "Muayene Tarihi",
          "required": true
        },
        {
          "name": "emniyet_sistemi",
          "type": "select",
          "label": "Emniyet Sistemi",
          "options": ["Uygun", "Uygun Değil"],
          "required": true
        },
        {
          "name": "test_sonuclari",
          "type": "table",
          "label": "Test Sonuçları",
          "columns": [
            {"name": "test_adi", "label": "Test Adı", "type": "text"},
            {"name": "sonuc", "label": "Sonuç", "type": "select", "options": ["Başarılı", "Başarısız"]}
          ]
        },
        {
          "name": "genel_gorunum",
          "type": "photo",
          "label": "Genel Görünüm",
          "required": true
        }
      ]
    }
  ]
}
```

## Güvenlik

- **JWT Authentication**: Tüm API'ler token tabanlı kimlik doğrulama kullanır
- **Permission-based Authorization**: Granular yetki kontrolü
- **Rate Limiting**: API abuse koruması
- **Input Validation**: Tüm girişler validate edilir
- **SQL Injection Protection**: Parameterized queries
- **File Upload Security**: Dosya türü ve boyut kontrolü
- **CORS Configuration**: Cross-origin istekleri güvenli şekilde yönetilir

## Test

```bash
# Veritabanı bağlantısını test et
npm run migrate

# API health check
curl http://localhost:3000/api/health
```

## Production Deployment

1. **Environment Variables**: Production değerlerini ayarlayın
2. **Database**: PostgreSQL production instance
3. **File Storage**: Cloud storage entegrasyonu (AWS S3, etc.)
4. **Email Service**: SMTP/SendGrid entegrasyonu
5. **SSL/TLS**: HTTPS sertifikası
6. **Process Manager**: PM2 veya benzer

## Geliştirme Notları

- Tüm API'ler RESTful standartlarına uygun
- Consistent error handling ve response format
- Comprehensive logging
- Database migrations ile schema yönetimi
- Modular architecture ile kolay genişletilebilirlik

### Son Güncellemeler (Ağustos 2025)
- ✅ **Express.js 4.x**: Routing compatibility için 5.x'den downgrade
- ✅ **Company Profile Endpoint**: `/api/companies/profile` eklendi
- ✅ **Manual Inspection Creation**: POST `/api/inspections` endpoint
- ✅ **Full CRUD**: Tüm modüller için eksik CRUD endpoint'ler tamamlandı
- ✅ **Enhanced Testing**: 60+ endpoint tam test edildi
- ✅ **Documentation**: API_USAGE_GUIDE.md ve PROJECT_STRUCTURE.md güncellendi

## Lisans

Bu proje özel kullanım içindir.