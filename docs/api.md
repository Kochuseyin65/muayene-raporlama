# API Dokümanı (REST)

Bu belge, backend API uçlarını, izinlerini, tipik istek/yanıt örneklerini ve hata modelini listeler.

## 1. Ortak Bilgiler
- Base URL (dev): `http://localhost:3000/api`
- Auth: `Authorization: Bearer <JWT>` (login sonrası).
- Yanıt şablonu:
```
{ "success": true|false, "data"?: any, "message"?: string, "error"?: { code, message, details? } }
```

## 2. Auth
- `POST /auth/login` → body: `{ email, password }` → `{ success, data: { token, user } }`
- `GET /auth/profile` → mevcut kullanıcı/firma bilgisi

## 3. Companies
- `GET /companies` (superAdmin)
- `GET /companies/profile` (auth) — kullanıcının firması
- `POST /companies` (superAdmin) — create
- `PUT /companies/:id` (companyAdmin)
- `DELETE /companies/:id` (superAdmin)

## 4. Customer Companies
- `GET /customer-companies?search=&page=&limit=` (viewCustomers)
- `GET /customer-companies/:id` (viewCustomers)
- `POST /customer-companies` (createCustomer)
- `PUT /customer-companies/:id` (editCustomer)
- `DELETE /customer-companies/:id` (any(companyAdmin, editCustomer))

## 5. Equipment
- `GET /equipment?search=&type=&page=&limit=` (viewEquipment)
- `GET /equipment/types` (viewEquipment)
- `GET /equipment/:id` (viewEquipment)
- `POST /equipment` (createEquipment) — `{ name, type, template }`
- `PUT /equipment/:id` (editEquipment)
- `PUT /equipment/:id/template` (editEquipment) — sadece template
- `DELETE /equipment/:id` (any(companyAdmin, editEquipment))

## 6. Offers
- `GET /offers?status=&search=&page=&limit=` (viewOffers)
- `GET /offers/:id` (viewOffers)
- `POST /offers` (createOffer)
- `PUT /offers/:id` (editOffer)
- `POST /offers/:id/approve` (approveOffer)
- `POST /offers/:id/send` (sendOffer)
- `POST /offers/:id/convert-to-work-order` (createWorkOrder)
- Public: `GET /offers/track/:token`, `POST /offers/track/:token/accept|decline`

## 7. Work Orders
- `GET /work-orders?status=&search=&assignedTo=&customerCompanyId=&mine=&page=&limit=` (viewWorkOrders|viewMyWorkOrders)
  - `mine=true` veya sadece `viewMyWorkOrders` iznine sahip kullanıcılar için sonuçlar otomatik olarak giriş yapan teknisyenle sınırlandırılır.
- `GET /work-orders/:id` (viewWorkOrders)
- `POST /work-orders` (createWorkOrder)
- `PUT /work-orders/:id` (editWorkOrder)
- `PUT /work-orders/:id/assign` (assignWorkOrder) — `{ technicianIds: number[] }`
- `PUT /work-orders/:id/status` (updateWorkOrderStatus) — `{ status }`
- `DELETE /work-orders/:id` (any(companyAdmin, editWorkOrder))

## 8. Inspections
- `GET /inspections?workOrderId=&technicianId=&status=&dateFrom=&dateTo=&equipmentType=&mine=&page=&limit=` (viewInspections|viewMyInspections)
  - `mine=true` veya yalnızca `viewMyInspections` iznine sahip kullanıcılar için sadece oturumdaki teknisyene atanmış muayeneler dönülür.
- `GET /inspections/:id` (viewInspections)
- `POST /inspections` (createWorkOrder)
- `PUT /inspections/:id` (editInspection) — `{ inspectionData, inspectionDate, startTime, endTime }`
- `POST /inspections/:id/save` (saveInspection)
- `POST /inspections/:id/complete` (completeInspection)
- `POST /inspections/:id/approve` (companyAdmin)
- `GET /inspections/check-availability?technicianId=&date=&startTime=&endTime=` (viewInspections)
- Fotoğraf: `POST /inspections/:id/photos` (uploadPhotos)

Saat formatı: `HH:MM` (UI `HH:MM:SS` gelirse `HH:MM`’e normalize edin).

## 9. Reports
- `POST /reports/:id/prepare` (viewReports)
- `POST /reports/:id/prepare-async` (viewReports) → `{ jobId, status }`
- `GET /reports/jobs/:jobId` (viewReports) → `{ status }`
- `GET /reports/:id/signing-data` (signReports) → `{ pdfBase64 }`
- `POST /reports/:id/sign` (signReports) — `{ pin, signedPdfBase64 }`
- `GET /reports/:id/download?signed=true|false` (downloadReports) → PDF
  - İçerik: `Content-Type: application/pdf`
  - İmzalı tercih: `signed=true` gönderildiğinde imzalı PDF varsa öncelikli olarak servis edilir; yoksa otomatik olarak imzasız PDF’e düşer (gerekirse yeniden üretilir).
  - Güvenli dosya adı: `Content-Disposition` RFC 5987 uyumlu — ASCII fallback `filename`, UTF‑8 için `filename*`.
  - PDF doğrulama: İndirme öncesi dosya `%PDF-` ile başlamıyorsa base64→binary düzeltmesi ve gerekirse imzasız rapor için yeniden üretim yapılır. Base64 onarımı yalnızca dosya boyutu eşik altında ise denenir (env: `PDF_BASE64_REPAIR_MAX_BYTES`, varsayılan 30MB).
- Public: `GET /reports/public/:qrToken` — rapor metadatası (imzalı/imsız)
- Public: `GET /reports/public/:qrToken/download?signed=true|false` — PDF indirme (imzalı yoksa otomatik imzasız)

## 10. Uploads
- `POST /uploads/company-logo` (companyAdmin) — field: `logo`
- `POST /uploads/inspection-photos/:inspectionId` (uploadPhotos) — field: `photos`; opsiyonel `fieldName`
- `DELETE /uploads/inspection-photos/:inspectionId/:photoFilename` (companyAdmin|uploadPhotos)
- `GET /uploads/logos/:filename`, `GET /uploads/inspections/:inspectionId/:filename` — public servis

## 11. Hata Örnekleri
```
401 UNAUTHORIZED
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Kimlik doğrulama gerekli" } }

403 PERMISSION_DENIED
{ "success": false, "error": { "code": "PERMISSION_DENIED", "message": "Bu işlem için yetkiniz bulunmuyor" } }

400 VALIDATION_ERROR (ör. saat)
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Geçerli bir saat formatı kullanınız" } }
```
