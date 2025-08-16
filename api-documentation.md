# Muayene ve Raporlama Sistemi - API Dokümantasyonu

## Genel Bilgiler

**Base URL:** `http://localhost:3000/api`  
**Authentication:** JWT Token (Bearer Token)  
**Content-Type:** `application/json`  
**Kod Standardı:** camelCase  

## 1. Authentication & Authorization

### 1.1 Login
```
POST /auth/login
Content-Type: application/json

Body:
{
  "email": "string",
  "password": "string"
}
```

### 1.2 Permission Check
```
GET /auth/check-permission/:permission
Authorization: Bearer {token}
```

### 1.3 Logout
```
POST /auth/logout
Authorization: Bearer {token}
```

## 2. Muayene Firmaları (Companies)

### 2.1 Get All Companies (Süper Admin)
```
GET /companies
Authorization: Bearer {token}
Permissions: ["superAdmin"]
```

### 2.2 Create Company (Süper Admin)
```
POST /companies
Authorization: Bearer {token}
Permissions: ["superAdmin"]

Body:
{
  "name": "string",
  "taxNumber": "string",
  "address": "string",
  "contact": "string",
  "logoUrl": "string"
}
```

### 2.3 Update Company
```
PUT /companies/:id
Authorization: Bearer {token}
Permissions: ["companyAdmin"] or ["superAdmin"]
```

### 2.4 Delete Company (Süper Admin)
```
DELETE /companies/:id
Authorization: Bearer {token}
Permissions: ["superAdmin"]
```

## 3. Teknisyenler (Technicians)

### 3.1 Get Company Technicians
```
GET /technicians
Authorization: Bearer {token}
Permissions: ["companyAdmin", "viewTechnicians"]
```

### 3.2 Create Technician
```
POST /technicians
Authorization: Bearer {token}
Permissions: ["companyAdmin"]

Body:
{
  "name": "string",
  "surname": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "eSignaturePin": "string",
  "permissions": ["array"]
}
```

### 3.3 Update Technician
```
PUT /technicians/:id
Authorization: Bearer {token}
Permissions: ["companyAdmin"]
```

### 3.4 Update Technician Permissions
```
PUT /technicians/:id/permissions
Authorization: Bearer {token}
Permissions: ["companyAdmin"]

Body:
{
  "permissions": ["array"]
}
```

## 4. Müşteri Firmaları (Customer Companies)

### 4.1 Get Customer Companies
```
GET /customer-companies
Authorization: Bearer {token}
Permissions: ["viewCustomers"]
```

### 4.2 Create Customer Company
```
POST /customer-companies
Authorization: Bearer {token}
Permissions: ["createCustomer"]

Body:
{
  "name": "string",
  "taxNumber": "string",
  "address": "string",
  "contact": "string",
  "email": "string",
  "authorizedPerson": "string"
}
```

## 5. Ekipmanlar (Equipment)

### 5.1 Get Equipment List
```
GET /equipment
Authorization: Bearer {token}
Permissions: ["viewEquipment"]
```

### 5.2 Create Equipment
```
POST /equipment
Authorization: Bearer {token}
Permissions: ["createEquipment"]

Body:
{
  "name": "string",
  "type": "string",
  "template": "object"
}
```

### 5.3 Update Equipment Template
```
PUT /equipment/:id/template
Authorization: Bearer {token}
Permissions: ["editEquipment"]
```

## 6. İş Teklifleri (Offers)

### 6.1 Get Offers
```
GET /offers
Authorization: Bearer {token}
Permissions: ["viewOffers"]

Query Parameters:
- status: ["pending", "approved", "sent", "viewed", "rejected"]
- page: number
- limit: number
```

### 6.2 Create Offer
```
POST /offers
Authorization: Bearer {token}
Permissions: ["createOffer"]

Body:
{
  "customerCompanyId": "number",
  "items": ["array"],
  "notes": "string"
}
```

### 6.3 Approve Offer
```
POST /offers/:id/approve
Authorization: Bearer {token}
Permissions: ["approveOffer"]
```

### 6.4 Send Offer to Customer
```
POST /offers/:id/send
Authorization: Bearer {token}
Permissions: ["sendOffer"]
```

### 6.5 Convert Offer to Work Order
```
POST /offers/:id/convert-to-work-order
Authorization: Bearer {token}
Permissions: ["createWorkOrder"]
```

### 6.6 Track Offer (Public)
```
GET /offers/track/:token
No Authorization Required
```

## 7. İş Emirleri (Work Orders)

### 7.1 Get Work Orders
```
GET /work-orders
Authorization: Bearer {token}
Permissions: ["viewWorkOrders"]

Query Parameters:
- status: ["not_started", "in_progress", "completed", "approved", "sent"]
- assignedTo: technician_id
- page: number
- limit: number
```

### 7.2 Create Work Order
```
POST /work-orders
Authorization: Bearer {token}
Permissions: ["createWorkOrder"]

Body:
{
  "customerCompanyId": "number",
  "assignedTechnicians": ["array"],
  "offerId": "number (optional)",
  "scheduledDate": "string",
  "equipmentIds": ["array"],
  "notes": "string"
}
```

### 7.3 Assign Technicians to Work Order
```
PUT /work-orders/:id/assign
Authorization: Bearer {token}
Permissions: ["assignWorkOrder"]

Body:
{
  "technicianIds": ["array"]
}
```

### 7.4 Update Work Order Status
```
PUT /work-orders/:id/status
Authorization: Bearer {token}
Permissions: ["updateWorkOrderStatus"]

Body:
{
  "status": "string"
}
```

## 8. Muayeneler (Inspections)

### 8.1 Get Inspections
```
GET /inspections
Authorization: Bearer {token}
Permissions: ["viewInspections"]

Query Parameters:
- workOrderId: number
- technicianId: number
- status: ["not_started", "in_progress", "completed", "approved"]
- dateFrom: YYYY-MM-DD
- dateTo: YYYY-MM-DD
```

### 8.2 Get Inspection Details
```
GET /inspections/:id
Authorization: Bearer {token}
Permissions: ["viewInspections"]
```

### 8.3 Update Inspection Data
```
PUT /inspections/:id
Authorization: Bearer {token}
Permissions: ["editInspection"]

Body:
{
  "inspectionData": "object",
  "status": "string"
}
```

### 8.4 Save Inspection (Generate Report)
```
POST /inspections/:id/save
Authorization: Bearer {token}
Permissions: ["saveInspection"]
```

### 8.5 Complete Inspection
```
POST /inspections/:id/complete
Authorization: Bearer {token}
Permissions: ["completeInspection"]
```

### 8.6 Upload Inspection Photos
```
POST /inspections/:id/photos
Authorization: Bearer {token}
Permissions: ["uploadPhotos"]
Content-Type: multipart/form-data

Body:
- photos: File[] (max 10 files, max 5MB each)
```

### 8.7 Check Time Slot Availability
```
GET /inspections/check-availability
Authorization: Bearer {token}
Permissions: ["viewInspections"]

Query Parameters:
- technicianId: number
- date: YYYY-MM-DD
- startTime: HH:MM
- endTime: HH:MM
```

## 9. Raporlar (Reports)

### 9.1 Get Report
```
GET /reports/:id
Authorization: Bearer {token}
Permissions: ["viewReports"]
```

### 9.2 Download Report PDF
```
GET /reports/:id/download
Authorization: Bearer {token}
Permissions: ["downloadReports"]

Query Parameters:
- signed: boolean (default: false)
```

### 9.3 Sign Report (E-Signature)
```
POST /reports/:id/sign
Authorization: Bearer {token}
Permissions: ["signReports"]

Body:
{
  "pin": "string",
  "signedPdfBase64": "string"
}
```

### 9.4 Send Report to Customer
```
POST /reports/:id/send
Authorization: Bearer {token}
Permissions: ["sendReports"]
```

### 9.5 Public Report View (QR Code)
```
GET /reports/public/:qrToken
No Authorization Required
```

## 10. E-İmza İşlemleri (E-Signature)

### 10.1 Get Signing Data
```
GET /reports/:id/signing-data
Authorization: Bearer {token}
Permissions: ["signReports"]
```

### 10.2 Local Signer Integration
```
Local signer endpoint: http://localhost:8080/sign
Method: POST
Body: { pdfBase64, pin }
```

## 11. File Upload & Management

### 11.1 Upload Company Logo
```
POST /uploads/company-logo
Authorization: Bearer {token}
Permissions: ["companyAdmin"]
Content-Type: multipart/form-data

Body:
- logo: File (max 2MB, jpg/png)
```

### 11.2 Upload Inspection Photos
```
POST /uploads/inspection-photos/:inspectionId
Authorization: Bearer {token}
Permissions: ["uploadPhotos"]
Content-Type: multipart/form-data

Body:
- photos: File[] (max 10 files, max 5MB each)
```

## 12. Dashboard & Statistics

### 12.1 Get Dashboard Stats
```
GET /dashboard/stats
Authorization: Bearer {token}
Permissions: ["viewDashboard"]
```

### 12.2 Get Calendar Events
```
GET /calendar/events
Authorization: Bearer {token}
Permissions: ["viewCalendar"]

Query Parameters:
- start: YYYY-MM-DD
- end: YYYY-MM-DD
- technicianId: number (optional)
```

## 13. Admin Panel

### 13.1 Get All Users (Company Admin)
```
GET /admin/users
Authorization: Bearer {token}
Permissions: ["companyAdmin"]
```

### 13.2 System Logs (Süper Admin)
```
GET /admin/logs
Authorization: Bearer {token}
Permissions: ["superAdmin"]

Query Parameters:
- level: ["info", "warn", "error"]
- startDate: YYYY-MM-DD
- endDate: YYYY-MM-DD
```

## Error Responses

Tüm endpoint'ler aşağıdaki format ile hata döner:

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

### Common Error Codes:
- `UNAUTHORIZED`: Token geçersiz veya eksik
- `PERMISSION_DENIED`: Yetkisiz işlem
- `VALIDATION_ERROR`: Geçersiz veri
- `NOT_FOUND`: Kayıt bulunamadı
- `CONFLICT`: Çakışan veri (örn: aynı saat aralığında muayene)
- `FILE_TOO_LARGE`: Dosya boyutu fazla
- `INVALID_FILE_TYPE`: Geçersiz dosya türü

## Rate Limiting

- Auth endpoint'leri: 5 request/minute
- File upload: 10 request/minute
- Diğer endpoint'ler: 100 request/minute

## Permissions List

```javascript
const PERMISSIONS = {
  // Company Management
  "companyAdmin": "Firma yönetimi",
  "superAdmin": "Sistem yönetimi",
  
  // User Management
  "viewTechnicians": "Teknisyenleri görüntüle",
  "createTechnician": "Teknisyen oluştur",
  "editTechnician": "Teknisyen düzenle",
  "deleteTechnician": "Teknisyen sil",
  
  // Customer Management
  "viewCustomers": "Müşterileri görüntüle",
  "createCustomer": "Müşteri oluştur",
  "editCustomer": "Müşteri düzenle",
  
  // Equipment Management
  "viewEquipment": "Ekipmanları görüntüle",
  "createEquipment": "Ekipman oluştur",
  "editEquipment": "Ekipman düzenle",
  
  // Offer Management
  "viewOffers": "Teklifleri görüntüle",
  "createOffer": "Teklif oluştur",
  "editOffer": "Teklif düzenle",
  "approveOffer": "Teklif onayla",
  "sendOffer": "Teklif gönder",
  
  // Work Order Management
  "viewWorkOrders": "İş emirlerini görüntüle",
  "createWorkOrder": "İş emri oluştur",
  "editWorkOrder": "İş emri düzenle",
  "assignWorkOrder": "İş emri ata",
  "updateWorkOrderStatus": "İş emri durumu güncelle",
  
  // Inspection Management
  "viewInspections": "Muayeneleri görüntüle",
  "editInspection": "Muayene düzenle",
  "saveInspection": "Muayene kaydet",
  "completeInspection": "Muayene tamamla",
  "uploadPhotos": "Fotoğraf yükle",
  
  // Report Management
  "viewReports": "Raporları görüntüle",
  "downloadReports": "Rapor indir",
  "signReports": "Rapor imzala",
  "sendReports": "Rapor gönder",
  
  // Dashboard & Calendar
  "viewDashboard": "Dashboard görüntüle",
  "viewCalendar": "Takvim görüntüle"
};
```

Bu API dokümantasyonu, projenin tüm temel işlevlerini kapsar ve backend geliştirme sürecinde rehber olarak kullanılabilir.