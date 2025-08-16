# Muayene ve Raporlama Sistemi - API Kullanım Klavuzu

Bu dokümantasyon, Muayene ve Raporlama Sistemi backend API'sinin kullanımı için kapsamlı bir rehberdir.

## 📋 İçindekiler

1. [Başlangıç](#başlangıç)
2. [Authentication](#authentication)
3. [Permission Sistemi](#permission-sistemi)
4. [API Endpoints](#api-endpoints)
5. [Örnekler](#örnekler)
6. [Hata Kodları](#hata-kodları)
7. [Rate Limiting](#rate-limiting)

## 🚀 Başlangıç

### Base URL
```
http://localhost:3000/api
```

### Content-Type
Tüm POST/PUT istekleri için:
```
Content-Type: application/json
```

### Authentication Header
Korunmuş endpoint'ler için:
```
Authorization: Bearer {your-jwt-token}
```

## 🔐 Authentication

### Giriş Yapma
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teknisyen@example.com",
  "password": "password123"
}
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Ahmet",
      "surname": "Yılmaz",
      "email": "ahmet@example.com",
      "company_id": 1,
      "permissions": ["viewInspections", "editInspection"]
    }
  }
}
```

### Profil Bilgilerini Alma
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### Yetki Kontrolü
```http
GET /api/auth/check-permission/createOffer
Authorization: Bearer {token}
```

### Çıkış Yapma
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

## 👥 Permission Sistemi

Sistem role-based değil, permission-based çalışır. Her kullanıcıya ihtiyaç duyduğu yetkiler atanır.

### Permission Listesi

#### Company Management
- `companyAdmin` - Firma yönetimi (tüm yetkileri kapsar)
- `superAdmin` - Sistem yönetimi (tüm firmalara erişim)

#### User Management
- `viewTechnicians` - Teknisyenleri görüntüle
- `createTechnician` - Teknisyen oluştur
- `editTechnician` - Teknisyen düzenle
- `deleteTechnician` - Teknisyen sil

#### Customer Management
- `viewCustomers` - Müşterileri görüntüle
- `createCustomer` - Müşteri oluştur
- `editCustomer` - Müşteri düzenle

#### Equipment Management
- `viewEquipment` - Ekipmanları görüntüle
- `createEquipment` - Ekipman oluştur
- `editEquipment` - Ekipman düzenle

#### Offer Management
- `viewOffers` - Teklifleri görüntüle
- `createOffer` - Teklif oluştur
- `editOffer` - Teklif düzenle
- `approveOffer` - Teklif onayla
- `sendOffer` - Teklif gönder

#### Work Order Management
- `viewWorkOrders` - İş emirlerini görüntüle
- `createWorkOrder` - İş emri oluştur
- `editWorkOrder` - İş emri düzenle
- `assignWorkOrder` - İş emri ata
- `updateWorkOrderStatus` - İş emri durumu güncelle

#### Inspection Management
- `viewInspections` - Muayeneleri görüntüle
- `editInspection` - Muayene düzenle
- `saveInspection` - Muayene kaydet
- `completeInspection` - Muayene tamamla
- `uploadPhotos` - Fotoğraf yükle

#### Report Management
- `viewReports` - Raporları görüntüle
- `downloadReports` - Rapor indir
- `signReports` - Rapor imzala
- `sendReports` - Rapor gönder

#### Dashboard & Calendar
- `viewDashboard` - Dashboard görüntüle
- `viewCalendar` - Takvim görüntüle

## 📡 API Endpoints

### 1. Companies (Muayene Firmaları)

#### Tüm Firmaları Listele (Super Admin)
```http
GET /api/companies
Authorization: Bearer {token}
Permissions: superAdmin
```

#### Firma Detayı
```http
GET /api/companies/{id}
Authorization: Bearer {token}
Permissions: companyAdmin
```

#### Yeni Firma Oluştur (Super Admin)
```http
POST /api/companies
Authorization: Bearer {token}
Permissions: superAdmin

{
  "name": "ABC Mühendislik A.Ş.",
  "taxNumber": "1234567890",
  "address": "İstanbul Ticaret Merkezi No: 123",
  "contact": "+90 212 555 0123",
  "logoUrl": "https://example.com/logo.png"
}
```

#### Firma Güncelle
```http
PUT /api/companies/{id}
Authorization: Bearer {token}
Permissions: companyAdmin

{
  "name": "ABC Mühendislik A.Ş.",
  "taxNumber": "1234567890",
  "address": "Yeni adres",
  "contact": "+90 212 555 0124",
  "logoUrl": "https://example.com/new-logo.png"
}
```

#### Firma Sil (Super Admin)
```http
DELETE /api/companies/{id}
Authorization: Bearer {token}
Permissions: superAdmin
```

### 2. Technicians (Teknisyenler)

#### Teknisyen Listesi
```http
GET /api/technicians
Authorization: Bearer {token}
Permissions: companyAdmin, viewTechnicians
```

#### Teknisyen Detayı
```http
GET /api/technicians/{id}
Authorization: Bearer {token}
Permissions: companyAdmin, viewTechnicians
```

#### Yeni Teknisyen Oluştur
```http
POST /api/technicians
Authorization: Bearer {token}
Permissions: companyAdmin

{
  "name": "Mehmet",
  "surname": "Demir",
  "email": "mehmet@example.com",
  "phone": "+90 555 123 4567",
  "password": "password123",
  "eSignaturePin": "123456",
  "permissions": ["viewInspections", "editInspection", "saveInspection"]
}
```

#### Teknisyen Güncelle
```http
PUT /api/technicians/{id}
Authorization: Bearer {token}
Permissions: companyAdmin

{
  "name": "Mehmet",
  "surname": "Demir",
  "email": "mehmet@example.com",
  "phone": "+90 555 123 4567",
  "eSignaturePin": "123456",
  "isActive": true
}
```

#### Teknisyen Yetkilerini Güncelle
```http
PUT /api/technicians/{id}/permissions
Authorization: Bearer {token}
Permissions: companyAdmin

{
  "permissions": ["viewInspections", "editInspection", "completeInspection", "signReports"]
}
```

#### Teknisyen Şifresini Güncelle
```http
PUT /api/technicians/{id}/password
Authorization: Bearer {token}
Permissions: companyAdmin

{
  "newPassword": "newpassword123"
}
```

#### Teknisyen Sil
```http
DELETE /api/technicians/{id}
Authorization: Bearer {token}
Permissions: companyAdmin
```

### 3. Customer Companies (Müşteri Firmaları)

#### Müşteri Firma Listesi
```http
GET /api/customer-companies?page=1&limit=20&search=ABC
Authorization: Bearer {token}
Permissions: viewCustomers

Query Parameters:
- page: Sayfa numarası (default: 1)
- limit: Sayfa başına kayıt (default: 20)
- search: Arama terimi (firma adı, vergi no, email)
```

#### Müşteri Firma Detayı
```http
GET /api/customer-companies/{id}
Authorization: Bearer {token}
Permissions: viewCustomers
```

#### Yeni Müşteri Firma Oluştur
```http
POST /api/customer-companies
Authorization: Bearer {token}
Permissions: createCustomer

{
  "name": "XYZ İnşaat Ltd.Şti.",
  "taxNumber": "9876543210",
  "address": "Ankara Sanayi Sitesi No: 456",
  "contact": "+90 312 555 0456",
  "email": "info@xyz.com",
  "authorizedPerson": "Ali Veli"
}
```

#### Müşteri Firma Güncelle
```http
PUT /api/customer-companies/{id}
Authorization: Bearer {token}
Permissions: editCustomer

{
  "name": "XYZ İnşaat Ltd.Şti.",
  "taxNumber": "9876543210",
  "address": "Yeni adres",
  "contact": "+90 312 555 0457",
  "email": "info@xyz.com",
  "authorizedPerson": "Ali Veli"
}
```

#### Müşteri Firma Sil
```http
DELETE /api/customer-companies/{id}
Authorization: Bearer {token}
Permissions: companyAdmin, editCustomer
```

### 4. Equipment (Ekipmanlar)

#### Ekipman Listesi
```http
GET /api/equipment?page=1&limit=20&search=vinç&type=vinc
Authorization: Bearer {token}
Permissions: viewEquipment

Query Parameters:
- page: Sayfa numarası
- limit: Sayfa başına kayıt
- search: Arama terimi
- type: Ekipman türü
```

#### Ekipman Türleri
```http
GET /api/equipment/types
Authorization: Bearer {token}
Permissions: viewEquipment
```

#### Ekipman Detayı
```http
GET /api/equipment/{id}
Authorization: Bearer {token}
Permissions: viewEquipment
```

#### Yeni Ekipman Oluştur
```http
POST /api/equipment
Authorization: Bearer {token}
Permissions: createEquipment

{
  "name": "Kule Vinç",
  "type": "vinc",
  "template": {
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
            "name": "seri_no",
            "type": "text",
            "label": "Seri Numarası",
            "required": true
          }
        ]
      },
      {
        "title": "Teknik Bilgiler",
        "fields": [
          {
            "name": "tonaj",
            "type": "number",
            "label": "Tonaj (ton)",
            "required": true
          },
          {
            "name": "emniyet_sistemi",
            "type": "select",
            "label": "Emniyet Sistemi",
            "options": ["Uygun", "Uygun Değil"],
            "required": true
          }
        ]
      },
      {
        "title": "Test Sonuçları",
        "fields": [
          {
            "name": "test_sonuclari",
            "type": "table",
            "label": "Test Sonuçları",
            "columns": [
              {"name": "test_adi", "label": "Test Adı", "type": "text"},
              {"name": "sonuc", "label": "Sonuç", "type": "select", "options": ["Başarılı", "Başarısız"]}
            ],
            "required": true
          }
        ]
      },
      {
        "title": "Fotoğraflar",
        "fields": [
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
}
```

#### Ekipman Güncelle
```http
PUT /api/equipment/{id}
Authorization: Bearer {token}
Permissions: editEquipment

{
  "name": "Kule Vinç",
  "type": "vinc",
  "template": { /* template object */ },
  "isActive": true
}
```

#### Sadece Şablon Güncelle
```http
PUT /api/equipment/{id}/template
Authorization: Bearer {token}
Permissions: editEquipment

{
  "template": { /* yeni template object */ }
}
```

#### Ekipman Sil
```http
DELETE /api/equipment/{id}
Authorization: Bearer {token}
Permissions: companyAdmin, editEquipment
```

### 5. Offers (İş Teklifleri)

#### Teklif Listesi
```http
GET /api/offers?page=1&limit=20&status=pending&search=OFFER-123&customerCompanyId=5
Authorization: Bearer {token}
Permissions: viewOffers

Query Parameters:
- page: Sayfa numarası
- limit: Sayfa başına kayıt
- status: pending, approved, sent, viewed, rejected
- search: Teklif numarası veya müşteri adında arama
- customerCompanyId: Belirli müşteri firmasının teklifleri
```

#### Teklif Detayı
```http
GET /api/offers/{id}
Authorization: Bearer {token}
Permissions: viewOffers
```

#### Yeni Teklif Oluştur
```http
POST /api/offers
Authorization: Bearer {token}
Permissions: createOffer

{
  "customerCompanyId": 5,
  "items": [
    {
      "equipmentId": 1,
      "quantity": 2,
      "unitPrice": 500.00,
      "description": "Kule vinç muayenesi"
    },
    {
      "equipmentId": 2,
      "quantity": 1,
      "unitPrice": 300.00,
      "description": "Basınçlı hava tankı muayenesi"
    }
  ],
  "notes": "Muayene çalışmaları 2 gün sürecektir."
}
```

#### Teklif Güncelle
```http
PUT /api/offers/{id}
Authorization: Bearer {token}
Permissions: editOffer

{
  "customerCompanyId": 5,
  "items": [
    {
      "equipmentId": 1,
      "quantity": 3,
      "unitPrice": 450.00,
      "description": "Güncellenmiş teklif kalemi"
    }
  ],
  "notes": "Güncellenmiş notlar"
}
```

#### Teklif Onayla
```http
POST /api/offers/{id}/approve
Authorization: Bearer {token}
Permissions: approveOffer
```

#### Teklif Gönder
```http
POST /api/offers/{id}/send
Authorization: Bearer {token}
Permissions: sendOffer
```

#### Teklifi İş Emrine Dönüştür
```http
POST /api/offers/{id}/convert-to-work-order
Authorization: Bearer {token}
Permissions: createWorkOrder

{
  "scheduledDate": "2024-01-15",
  "notes": "Acil muayene gerekli"
}
```

#### Teklif Takip (Public - Auth Gerekmez)
```http
GET /api/offers/track/{tracking-token}
```

#### Teklif Sil
```http
DELETE /api/offers/{id}
Authorization: Bearer {token}
Permissions: companyAdmin, editOffer
```

### 6. Work Orders (İş Emirleri)

#### İş Emri Listesi
```http
GET /api/work-orders?page=1&limit=20&status=in_progress&assignedTo=3&customerCompanyId=5
Authorization: Bearer {token}
Permissions: viewWorkOrders

Query Parameters:
- page: Sayfa numarası
- limit: Sayfa başına kayıt
- status: not_started, in_progress, completed, approved, sent
- assignedTo: Atanan teknisyen ID'si
- search: İş emri numarası veya müşteri adında arama
- customerCompanyId: Belirli müşteri firmasının iş emirleri
```

#### İş Emri Detayı
```http
GET /api/work-orders/{id}
Authorization: Bearer {token}
Permissions: viewWorkOrders
```

#### Yeni İş Emri Oluştur
```http
POST /api/work-orders
Authorization: Bearer {token}
Permissions: createWorkOrder

{
  "customerCompanyId": 5,
  "assignedTechnicians": [3, 4],
  "scheduledDate": "2024-01-15",
  "equipmentIds": [1, 2],
  "notes": "Acil muayene gerekli"
}
```

#### İş Emri Güncelle
```http
PUT /api/work-orders/{id}
Authorization: Bearer {token}
Permissions: editWorkOrder

{
  "customerCompanyId": 5,
  "scheduledDate": "2024-01-16",
  "notes": "Tarih güncellendi"
}
```

#### Teknisyen Atama
```http
PUT /api/work-orders/{id}/assign
Authorization: Bearer {token}
Permissions: assignWorkOrder

{
  "technicianIds": [3, 4, 5]
}
```

#### İş Emri Durumu Güncelle
```http
PUT /api/work-orders/{id}/status
Authorization: Bearer {token}
Permissions: updateWorkOrderStatus

{
  "status": "in_progress"
}
```

#### İş Emri Sil
```http
DELETE /api/work-orders/{id}
Authorization: Bearer {token}
Permissions: companyAdmin, editWorkOrder
```

### 7. Inspections (Muayeneler)

#### Muayene Listesi
```http
GET /api/inspections?page=1&limit=20&workOrderId=10&technicianId=3&status=completed&dateFrom=2024-01-01&dateTo=2024-01-31&equipmentType=vinc
Authorization: Bearer {token}
Permissions: viewInspections

Query Parameters:
- page: Sayfa numarası
- limit: Sayfa başına kayıt
- workOrderId: İş emri ID'si
- technicianId: Teknisyen ID'si
- status: not_started, in_progress, completed, approved
- dateFrom: Başlangıç tarihi (YYYY-MM-DD)
- dateTo: Bitiş tarihi (YYYY-MM-DD)
- equipmentType: Ekipman türü
```

#### Saat Aralığı Kontrolü
```http
GET /api/inspections/check-availability?technicianId=3&date=2024-01-15&startTime=09:00&endTime=12:00
Authorization: Bearer {token}
Permissions: viewInspections
```

#### Muayene Detayı
```http
GET /api/inspections/{id}
Authorization: Bearer {token}
Permissions: viewInspections
```

#### Muayene Güncelle
```http
PUT /api/inspections/{id}
Authorization: Bearer {token}
Permissions: editInspection

{
  "inspectionData": {
    "muayene_tarihi": "2024-01-15",
    "seri_no": "ABC123",
    "tonaj": 5,
    "emniyet_sistemi": "Uygun",
    "test_sonuclari": [
      {
        "test_adi": "Fren Testi",
        "sonuc": "Başarılı"
      },
      {
        "test_adi": "Hidrolik Test",
        "sonuc": "Başarılı"
      }
    ]
  },
  "status": "in_progress",
  "inspectionDate": "2024-01-15",
  "startTime": "09:00",
  "endTime": "12:00"
}
```

#### Muayene Kaydet (Rapor Oluştur)
```http
POST /api/inspections/{id}/save
Authorization: Bearer {token}
Permissions: saveInspection
```

#### Muayene Tamamla
```http
POST /api/inspections/{id}/complete
Authorization: Bearer {token}
Permissions: completeInspection
```

#### Muayene Fotoğrafı Yükle
```http
POST /api/inspections/{id}/photos
Authorization: Bearer {token}
Permissions: uploadPhotos
Content-Type: multipart/form-data

Form Data:
- photos: File[] (Maximum 10 files, 5MB each)
```

### 8. Reports (Raporlar)

#### Rapor Detayı
```http
GET /api/reports/{id}
Authorization: Bearer {token}
Permissions: viewReports
```

#### Rapor İndir
```http
GET /api/reports/{id}/download?signed=true
Authorization: Bearer {token}
Permissions: downloadReports

Query Parameters:
- signed: true/false (imzalı veya imzasız rapor)
```

#### İmzalama Verilerini Al
```http
GET /api/reports/{id}/signing-data
Authorization: Bearer {token}
Permissions: signReports
```

#### Rapor İmzala
```http
POST /api/reports/{id}/sign
Authorization: Bearer {token}
Permissions: signReports

{
  "pin": "123456",
  "signedPdfBase64": "JVBERi0xLjQKMSAwIG9iago8PAo..."
}
```

#### Rapor Gönder
```http
POST /api/reports/{id}/send
Authorization: Bearer {token}
Permissions: sendReports
```

#### Public Rapor Görüntüle (QR Code)
```http
GET /api/reports/public/{qr-token}
# Auth gerekmez
```

### 9. Uploads (Dosya Yükleme)

#### Firma Logosu Yükle
```http
POST /api/uploads/company-logo
Authorization: Bearer {token}
Permissions: companyAdmin
Content-Type: multipart/form-data

Form Data:
- logo: File (Maximum 2MB, jpg/png/gif/webp)
```

#### Muayene Fotoğrafı Yükle
```http
POST /api/uploads/inspection-photos/{inspectionId}
Authorization: Bearer {token}
Permissions: uploadPhotos
Content-Type: multipart/form-data

Form Data:
- photos: File[] (Maximum 10 files, 5MB each)
```

#### Muayene Fotoğrafı Sil
```http
DELETE /api/uploads/inspection-photos/{inspectionId}/{filename}
Authorization: Bearer {token}
Permissions: companyAdmin, uploadPhotos
```

#### Dosya Erişimi
```http
GET /api/uploads/{type}/{path}
# Public erişim (logos, inspection photos)
```

## 📝 Örnekler

### Tam İş Akışı Örneği

#### 1. Giriş Yap
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'teknisyen@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const token = data.token;
```

#### 2. Müşteri Firma Oluştur
```javascript
const customerResponse = await fetch('/api/customer-companies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'XYZ İnşaat',
    email: 'info@xyz.com',
    taxNumber: '1234567890'
  })
});

const customer = await customerResponse.json();
```

#### 3. Teklif Oluştur
```javascript
const offerResponse = await fetch('/api/offers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    customerCompanyId: customer.data.id,
    items: [
      {
        equipmentId: 1,
        quantity: 2,
        unitPrice: 500.00
      }
    ],
    notes: 'Acil muayene'
  })
});

const offer = await offerResponse.json();
```

#### 4. Teklifi Onayla ve İş Emrine Dönüştür
```javascript
// Onayla
await fetch(`/api/offers/${offer.data.id}/approve`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// İş emrine dönüştür
const workOrderResponse = await fetch(`/api/offers/${offer.data.id}/convert-to-work-order`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    scheduledDate: '2024-01-15',
    notes: 'Acil'
  })
});

const workOrder = await workOrderResponse.json();
```

#### 5. Muayene Yap
```javascript
// Muayeneleri listele
const inspectionsResponse = await fetch(`/api/inspections?workOrderId=${workOrder.data.id}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const inspections = await inspectionsResponse.json();
const inspectionId = inspections.data.inspections[0].id;

// Muayene verilerini güncelle
await fetch(`/api/inspections/${inspectionId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    inspectionData: {
      muayene_tarihi: '2024-01-15',
      tonaj: 5,
      emniyet_sistemi: 'Uygun'
    },
    status: 'completed'
  })
});

// Muayeneyi tamamla
await fetch(`/api/inspections/${inspectionId}/complete`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### 6. Rapor İmzala ve Gönder
```javascript
// İmzalama verilerini al
const signingDataResponse = await fetch(`/api/reports/${reportId}/signing-data`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const signingData = await signingDataResponse.json();

// Local signer ile imzala (client-side)
const signedPdfResponse = await fetch('http://localhost:8080/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdfBase64: signingData.data.pdfBase64,
    pin: '123456'
  })
});

const signedData = await signedPdfResponse.json();

// İmzalanmış raporu kaydet
await fetch(`/api/reports/${reportId}/sign`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    pin: '123456',
    signedPdfBase64: signedData.signedPdfBase64
  })
});

// Raporu gönder
await fetch(`/api/reports/${reportId}/send`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Dosya Yükleme Örneği

```javascript
// Muayene fotoğrafı yükle
const formData = new FormData();
formData.append('photos', file1);
formData.append('photos', file2);

const uploadResponse = await fetch(`/api/uploads/inspection-photos/${inspectionId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const uploadResult = await uploadResponse.json();
```

### Pagination Örneği

```javascript
// Sayfalı veri çekme
const page = 1;
const limit = 20;
const search = 'ABC';

const response = await fetch(`/api/customer-companies?page=${page}&limit=${limit}&search=${search}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const result = await response.json();

console.log('Müşteriler:', result.data.customers);
console.log('Pagination:', result.data.pagination);
// {
//   currentPage: 1,
//   totalPages: 5,
//   totalCount: 89,
//   hasNext: true,
//   hasPrev: false
// }
```

## ❌ Hata Kodları

### HTTP Status Kodları
- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Geçersiz istek
- `401` - Yetkilendirme gerekli
- `403` - Erişim reddedildi
- `404` - Bulunamadı
- `409` - Çakışma (conflict)
- `429` - Rate limit aşıldı
- `500` - Sunucu hatası

### Hata Response Formatı
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Bu işlem için yetkiniz bulunmuyor",
    "details": "createOffer permission required"
  }
}
```

### Yaygın Hata Kodları
- `UNAUTHORIZED` - Token geçersiz veya eksik
- `PERMISSION_DENIED` - Yetkisiz işlem
- `VALIDATION_ERROR` - Geçersiz veri
- `NOT_FOUND` - Kayıt bulunamadı
- `CONFLICT` - Çakışan veri
- `FILE_TOO_LARGE` - Dosya boyutu fazla
- `INVALID_FILE_TYPE` - Geçersiz dosya türü
- `RATE_LIMIT` - Çok fazla istek

### Validation Error Örneği
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Geçersiz veri",
    "details": [
      {
        "field": "email",
        "message": "Geçerli bir e-posta adresi giriniz"
      },
      {
        "field": "password",
        "message": "Şifre en az 6 karakter olmalıdır"
      }
    ]
  }
}
```

## 🚦 Rate Limiting

### Limitler
- **Auth endpoint'leri**: 5 request/minute
- **File upload**: 10 request/minute  
- **Diğer endpoint'ler**: 100 request/minute

### Rate Limit Headers
Response'da rate limit bilgileri:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Aşıldığında
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Çok fazla istek"
  }
}
```

## 🔄 Response Formatı

### Başarılı Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "İşlem başarılı" // Optional
}
```

### Pagination ile Response
```json
{
  "success": true,
  "data": {
    "items": [/* data array */],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 200,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🎯 Best Practices

### 1. Authentication
- Token'ı her istekte header'da gönder
- Token süresini kontrol et, gerekirse yenile
- Logout sonrası token'ı local storage'dan sil

### 2. Error Handling
- HTTP status kodlarını kontrol et
- Error response'undaki `code` alanını kullan
- User-friendly mesajlar göster

### 3. File Upload
- Dosya boyutu limitlerini kontrol et
- Allowed file types'ı doğrula
- Progress indicator göster

### 4. Performance
- Pagination kullan
- Gerekli olmayan verileri çekme
- Cache'leme stratejisi uygula

### 5. Security
- Token'ı güvenli sakla
- HTTPS kullan
- Input validation yap

## 📚 Ek Kaynaklar

- [Ekipman Şablon Örnekleri](./template-examples.md)
- [E-imza Entegrasyon Rehberi](./esignature-guide.md)
- [Database Schema](./database-schema.md)
- [Deployment Guide](./deployment.md)

## 📞 Destek

API kullanımında sorun yaşarsanız:
- GitHub Issues: [Proje Repository](https://github.com/company/muayene-system)
- Email: support@company.com
- Documentation: [API Docs](https://docs.company.com/api)

---

*Bu dokümantasyon sürekli güncellenmektedir. Son versiyonu için repository'yi kontrol ediniz.*