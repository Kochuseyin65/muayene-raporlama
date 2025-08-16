# Muayene ve Raporlama Sistemi - API Kullanım Klavuzu

Bu klavuz, Muayene ve Raporlama Sistemi API'sinin nasıl kullanılacağını basit ve anlaşılır şekilde açıklar.

## 🚀 Hızlı Başlangıç

### Sunucu Bilgileri
- **Base URL**: `http://localhost:3000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

### Test Kullanıcıları
```
Super Admin: superadmin@abc.com / password
Company Admin: admin@abc.com / password  
Technician: ahmet@abc.com / password
```

## 🔐 Authentication (Kimlik Doğrulama)

### Giriş Yapma
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@abc.com",
  "password": "password"
}
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "Firma",
      "surname": "Admin",
      "email": "admin@abc.com",
      "permissions": ["companyAdmin", "viewTechnicians", ...]
    }
  }
}
```

**Token Kullanımı:**
Bundan sonraki tüm isteklerde header'a token ekleyin:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

## 🏢 Firma Yönetimi

### Firma Profili
```http
GET /api/companies/profile
Authorization: Bearer {token}
```

### Firma Bilgilerini Güncelleme
```http
PUT /api/companies/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "ABC Mühendislik A.Ş.",
  "taxNumber": "1234567890",
  "address": "İstanbul Ticaret Merkezi No: 123",
  "contact": "+90 212 555 0123"
}
```

## 👥 Teknisyen Yönetimi

### Teknisyen Listesi
```http
GET /api/technicians
Authorization: Bearer {token}
```

### Yeni Teknisyen Ekleme
```http
POST /api/technicians
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mehmet",
  "surname": "Yılmaz",
  "email": "mehmet@abc.com",
  "phone": "+90 555 0001",
  "password": "123456",
  "permissions": ["viewInspections", "editInspection"]
}
```

### Teknisyen Detayı
```http
GET /api/technicians/{id}
Authorization: Bearer {token}
```

### Teknisyen Güncelleme
```http
PUT /api/technicians/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mehmet",
  "surname": "Yılmaz",
  "phone": "+90 555 0002"
}
```

## 🏭 Müşteri Firma Yönetimi

### Müşteri Firma Listesi
```http
GET /api/customer-companies?page=1&limit=10&search=xyz
Authorization: Bearer {token}
```

### Yeni Müşteri Firma
```http
POST /api/customer-companies
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "XYZ İnşaat Ltd.Şti.",
  "taxNumber": "9876543210",
  "email": "info@xyz.com",
  "address": "Ankara Sanayi Sitesi",
  "contact": "+90 312 555 0456",
  "authorizedPerson": "Mehmet Demir"
}
```

### Müşteri Firma Detayı
```http
GET /api/customer-companies/{id}
Authorization: Bearer {token}
```

## ⚙️ Ekipman Yönetimi

### Ekipman Listesi
```http
GET /api/equipment?page=1&limit=10&type=vinc
Authorization: Bearer {token}
```

### Ekipman Türleri
```http
GET /api/equipment/types
Authorization: Bearer {token}
```

### Yeni Ekipman Ekleme
```http
POST /api/equipment
Authorization: Bearer {token}
Content-Type: application/json

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
      }
    ]
  }
}
```

### Ekipman Detayı
```http
GET /api/equipment/{id}
Authorization: Bearer {token}
```

### Sadece Şablon Güncelleme
```http
PUT /api/equipment/{id}/template
Authorization: Bearer {token}
Content-Type: application/json

{
  "template": {
    "sections": [...]
  }
}
```

## 💰 Teklif Yönetimi

### Teklif Listesi
```http
GET /api/offers?status=pending&page=1
Authorization: Bearer {token}
```

### Yeni Teklif Oluşturma
```http
POST /api/offers
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerCompanyId": 1,
  "items": [
    {
      "equipmentId": 1,
      "quantity": 2,
      "unitPrice": 500.00,
      "description": "Kule vinç muayenesi"
    }
  ],
  "notes": "Muayene çalışmaları 2 gün sürecektir"
}
```

### Teklif Detayı
```http
GET /api/offers/{id}
Authorization: Bearer {token}
```

### Teklif Onaylama
```http
POST /api/offers/{id}/approve
Authorization: Bearer {token}
```

### Teklif Gönderme
```http
POST /api/offers/{id}/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerEmail": "info@xyz.com"
}
```

### Teklif Takibi (Public - Token gerekmez)
```http
GET /api/offers/track/{tracking_token}
```

### Teklifi İş Emrine Dönüştürme
```http
POST /api/offers/{id}/convert-to-work-order
Authorization: Bearer {token}
Content-Type: application/json

{
  "scheduledDate": "2025-08-25",
  "notes": "Teklif onaylandı"
}
```

## 📋 İş Emri Yönetimi

### İş Emri Listesi
```http
GET /api/work-orders?status=not_started&page=1
Authorization: Bearer {token}
```

### Yeni İş Emri
```http
POST /api/work-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerCompanyId": 1,
  "scheduledDate": "2025-08-25",
  "notes": "Acil muayene"
}
```

### İş Emri Detayı (Muayeneler dahil)
```http
GET /api/work-orders/{id}
Authorization: Bearer {token}
```

### Teknisyen Atama
```http
PUT /api/work-orders/{id}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "technicianIds": [3, 4]
}
```

### Durum Güncelleme
```http
PUT /api/work-orders/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress"
}
```

## 🔍 Muayene Yönetimi

### Muayene Listesi
```http
GET /api/inspections?workOrderId=1&status=completed
Authorization: Bearer {token}
```

### Yeni Muayene Oluşturma
```http
POST /api/inspections
Authorization: Bearer {token}
Content-Type: application/json

{
  "workOrderId": 1,
  "equipmentId": 1,
  "technicianId": 3,
  "inspectionDate": "2025-08-20",
  "startTime": "09:00",
  "endTime": "12:00"
}
```

### Saat Uygunluk Kontrolü
```http
GET /api/inspections/check-availability?technicianId=3&date=2025-08-20&startTime=09:00&endTime=12:00
Authorization: Bearer {token}
```

### Muayene Detayı
```http
GET /api/inspections/{id}
Authorization: Bearer {token}
```

### Muayene Verilerini Güncelleme
```http
PUT /api/inspections/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "inspectionData": {
    "muayene_tarihi": "2025-08-20",
    "seri_no": "ABC123",
    "emniyet_sistemi": "Uygun"
  }
}
```

### Muayene Kaydetme (Rapor Oluşturma)
```http
POST /api/inspections/{id}/save
Authorization: Bearer {token}
```

### Muayene Tamamlama
```http
POST /api/inspections/{id}/complete
Authorization: Bearer {token}
```

## 📸 Dosya Yükleme

### Firma Logosu Yükleme
```http
POST /api/uploads/company-logo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- logo: [image file]
```

### Muayene Fotoğrafı Yükleme
```http
POST /api/uploads/inspection-photos/{inspectionId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- photos: [multiple image files]
```

### Dosya Erişimi
```http
GET /api/uploads/logos/{filename}
GET /api/uploads/inspections/{inspectionId}/{filename}
```

## 📄 Rapor Yönetimi

### Rapor Detayı
```http
GET /api/reports/{id}
Authorization: Bearer {token}
```

### Rapor İndirme
```http
GET /api/reports/{id}/download
Authorization: Bearer {token}
```

### İmzalama Verileri
```http
GET /api/reports/{id}/signing-data
Authorization: Bearer {token}
```

### Rapor İmzalama
```http
POST /api/reports/{id}/sign
Authorization: Bearer {token}
Content-Type: application/json

{
  "signedPdfBase64": "base64_encoded_signed_pdf"
}
```

### Public Rapor Erişimi (QR Code)
```http
GET /api/reports/public/{qrToken}
```

## 🔧 Sistem Endpoints

### Sağlık Kontrolü
```http
GET /api/health
```

**Yanıt:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

## 📋 Tam İş Akışı Örneği

### 1. Giriş Yap
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@abc.com","password":"password"}'
```

### 2. Müşteri Firma Ekle
```bash
curl -X POST http://localhost:3000/api/customer-companies \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Firma","email":"test@test.com","taxNumber":"1111111111"}'
```

### 3. Teklif Oluştur
```bash
curl -X POST http://localhost:3000/api/offers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"customerCompanyId":1,"items":[{"equipmentId":1,"quantity":1,"unitPrice":500}]}'
```

### 4. Teklif Onayla
```bash
curl -X POST http://localhost:3000/api/offers/1/approve \
  -H "Authorization: Bearer {token}"
```

### 5. İş Emrine Dönüştür
```bash
curl -X POST http://localhost:3000/api/offers/1/convert-to-work-order \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"scheduledDate":"2025-08-25"}'
```

### 6. Muayene Oluştur
```bash
curl -X POST http://localhost:3000/api/inspections \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"workOrderId":1,"equipmentId":1,"technicianId":3,"inspectionDate":"2025-08-25","startTime":"09:00","endTime":"12:00"}'
```

### 7. Muayene Kaydet
```bash
curl -X POST http://localhost:3000/api/inspections/1/save \
  -H "Authorization: Bearer {token}"
```

## ❌ Hata Kodları

| HTTP Status | Error Code | Açıklama |
|-------------|------------|----------|
| 400 | VALIDATION_ERROR | Geçersiz veri |
| 401 | UNAUTHORIZED | Geçersiz token |
| 403 | PERMISSION_DENIED | Yetki yok |
| 404 | NOT_FOUND | Kayıt bulunamadı |
| 409 | CONFLICT | Çakışma (zaman, unique) |
| 429 | RATE_LIMIT | Çok fazla istek |
| 500 | INTERNAL_SERVER_ERROR | Sunucu hatası |

## 🔑 Yetki Sistemi

### Ana Yetkiler
- `superAdmin`: Sistem yönetimi
- `companyAdmin`: Firma yönetimi
- `viewTechnicians`, `createTechnician`: Teknisyen yönetimi
- `viewCustomers`, `createCustomer`: Müşteri yönetimi
- `viewEquipment`, `createEquipment`: Ekipman yönetimi
- `viewOffers`, `createOffer`, `approveOffer`: Teklif yönetimi
- `viewWorkOrders`, `createWorkOrder`: İş emri yönetimi
- `viewInspections`, `editInspection`, `completeInspection`: Muayene yönetimi
- `viewReports`, `downloadReports`, `signReports`: Rapor yönetimi

### Yetki Kontrolü
Her endpoint belirli yetkiler gerektirir. Token'ınızda olmayan yetkiler için 403 hatası alırsınız.

---

Bu klavuz ile API'yi kolayca kullanabilirsiniz. Daha detaylı bilgi için `PROJECT_STRUCTURE.md` dosyasını inceleyebilirsiniz.