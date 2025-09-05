# Muayene ve Raporlama Sistemi — Kod Tabanı İnceleme Raporu

Tarih: 2025-09-05

Bu rapor, depo kökünde yer alan tüm dosyaların tek tek incelenmesiyle hazırlanmıştır. Aşağıdaki içerik, kod tabanının genel yapısını, modülleri, uç noktaları, veri modelini, yardımcı bileşenleri ve çalıştırma talimatlarını kapsamlı biçimde özetler.

## Amaç ve Kapsam
- Amaç: Çok kiracılı muayene ve raporlama süreçlerini dijitalleştiren bir web uygulaması.
- Süreç: Teklif → İş Emri → Muayene → Rapor → E‑İmza.
- Yığın: Node.js (Express), PostgreSQL, JWT, Multer, Puppeteer, SQL migrasyonları.
- Ana servis: `backend/` altında Express tabanlı API. Veri şeması SQL migrasyonlarıyla yönetilir.

## Depo Yerleşimi
```
/ (repo kökü)
├── backend/                  # Express API sunucusu
│   ├── app.js               # Uygulama orkestrasyonu, rotalar, hata yakalama
│   ├── config/
│   │   ├── database.js      # pg Pool, .env ile yapılandırma
│   │   └── migrations/      # SQL şema evrimi (001..006)
│   ├── controllers/         # İş kuralları ve endpoint handler'ları
│   ├── middleware/          # Kimlik, yetki, yükleme
│   ├── routes/              # Kaynak bazlı Express router'ları
│   ├── utils/               # Migrasyon, PDF, render, worker, storage
│   └── uploads/             # Çalışma zamanı dosya kökleri (logos, inspections, reports)
├── scripts/                 # Uçtan uca test script'i ve çıktısı
├── README.md                # Genel kurulum ve özet
├── api-documentation.md     # API belgesi (rehber)
├── doc.md                   # Türkçe genel dokümantasyon
├── FRONTEND_DEVELOPMENT_PLAN.md, frontend.md # Ön yüz plan/UX
└── signer.md                # E‑imza istemci notları/kodu
```

## Çalışma Akışı ve Mimari
- Mimari: Monolitik Express API; MVC-benzeri katmanlama (Controller + JSON view). 
- Veri modeli: İlişkisel şema; dinamik alanlar için JSONB (ekipman şablonları ve muayene verisi).
- Kimlik: JWT tabanlı; `auth` middleware `req.user` yükler.
- Yetki: İnce taneli izin sistemi (`permissions.js`), `superAdmin` geniş yetkili.
- Dosya yönetimi: Multer ile yükleme; rapor PDF'leri dosya sisteminde saklanır; path'ler DB'de.
- PDF üretimi: Puppeteer ile HTML→PDF; senkron ve kuyruğa alınmış (worker) yöntemleri destekler. Rapor PDF'leri yalnızca dosya sisteminde tutulur; base64 saklama/fallback kaldırıldı.
- Hata yönetimi: Controller düzeyinde `try/catch`; global 500 ve 404 handler.

## API Uç Noktaları (Mount: `/api`)

### Genel
- `GET /api/health` — Sunucu sağlık kontrolü.

### Kimlik (`/api/auth`)
- `POST /login` — Giriş (public). 
- `POST /logout` — Çıkış (auth).
- `GET /profile` — Aktif kullanıcı/firma (auth).
- `GET /check-permission/:permission` — İzin kontrolü (auth).

### Firma Yönetimi (`/api/companies`)
- `GET /` — Tüm firmalar (auth + `superAdmin`).
- `GET /profile` — Kullanıcının firması (auth).
- `GET /:id` — Firma detayı (auth + `companyAdmin`).
- `POST /` — Firma oluştur (auth + `superAdmin`).
- `PUT /:id` — Firma güncelle (auth + `companyAdmin`).
- `DELETE /:id` — Firma sil (auth + `superAdmin`).

### Müşteri Firmaları (`/api/customer-companies`)
- `GET /` — Liste (auth + `viewCustomers`).
- `GET /:id` — Detay (auth + `viewCustomers`).
- `POST /` — Oluştur (auth + `createCustomer`).
- `PUT /:id` — Güncelle (auth + `editCustomer`).
- `DELETE /:id` — Sil (auth + any(`companyAdmin`, `editCustomer`)).

### Ekipmanlar (`/api/equipment`)
- `GET /` — Liste (auth + `viewEquipment`).
- `GET /types` — Tipler (auth + `viewEquipment`).
- `GET /:id` — Detay (auth + `viewEquipment`).
- `POST /` — Oluştur (auth + `createEquipment`).
- `PUT /:id` — Güncelle (auth + `editEquipment`).
- `PUT /:id/template` — Sadece şablon (auth + `editEquipment`).
- `DELETE /:id` — Sil (auth + any(`companyAdmin`, `editEquipment`)).

### Muayeneler (`/api/inspections`)
- `GET /` — Liste (auth + `viewInspections`).
- `GET /check-availability` — Zaman dilimi uygunluğu (auth + `viewInspections`).
- `POST /` — Oluştur (auth + `createWorkOrder`).
- `GET /:id` — Detay (auth + `viewInspections`).
- `PUT /:id` — Güncelle (auth + `editInspection`).
- `POST /:id/save` — Kaydet → rapor hazırlığı (auth + `saveInspection`).
- `POST /:id/complete` — Tamamla (auth + `completeInspection`).
- `POST /:id/approve` — Onayla (auth + `companyAdmin`).
- `POST /:id/photos` — Foto yükle (auth + `uploadPhotos`).

### Teklifler (`/api/offers`)
- `GET /` — Liste (auth + `viewOffers`).
- `GET /track/:token` — Public takip (no auth).
- `POST /track/:token/accept` — Müşteri kabul (no auth).
- `POST /track/:token/decline` — Müşteri ret (no auth).
- `GET /:id` — Detay (auth + `viewOffers`).
- `POST /` — Oluştur (auth + `createOffer`).
- `PUT /:id` — Güncelle (auth + `editOffer`).
- `POST /:id/approve` — Onay (auth + `approveOffer`).
- `POST /:id/send` — Gönder (auth + `sendOffer`).
- `POST /:id/convert-to-work-order` — İş emri oluştur (auth + `createWorkOrder`).
- `DELETE /:id` — Sil (auth + any(`companyAdmin`, `editOffer`)).

### İş Emirleri (`/api/work-orders`)
- `GET /` — Liste (auth + `viewWorkOrders`).
- `GET /:id` — Detay (auth + `viewWorkOrders`).
- `POST /` — Oluştur (auth + `createWorkOrder`).
- `PUT /:id` — Güncelle (auth + `editWorkOrder`).
- `PUT /:id/assign` — Teknisyen ata (auth + `assignWorkOrder`).
- `PUT /:id/status` — Durum (auth + `updateWorkOrderStatus`).
- `DELETE /:id` — Sil (auth + any(`companyAdmin`, `editWorkOrder`)).

### Raporlar (`/api/reports`)
- `GET /public/:qrToken` — QR ile public görüntüleme (no auth).
- `GET /:id` — Rapor verisi (auth + `viewReports`).
- `GET /:id/download` — PDF indir (auth + `downloadReports`, `?signed=true|false`).
- `POST /:id/prepare` — Senkron imzasız PDF hazırla (auth + `viewReports`).
- `POST /:id/prepare-async` — PDF üretimini kuyruğa al (auth + `viewReports`).
- `GET /jobs/:jobId` — PDF iş durumu (auth + `viewReports`).
- `GET /:id/signing-data` — İmzalama verisi (auth + `signReports`).
- `POST /:id/sign` — İmzalama (auth + `signReports`).
- `POST /:id/send` — Gönderim (auth + `sendReports`).

### Yüklemeler (`/api/uploads`)
- `POST /company-logo` — Logo yükle (auth + `companyAdmin`).
- `POST /inspection-photos/:inspectionId` — Foto yükle (auth + `uploadPhotos`).
- `DELETE /inspection-photos/:inspectionId/:photoFilename` — Foto sil (auth + any(`companyAdmin`, `uploadPhotos`)).
- `GET /logos/:filename` — Logo dosyası (public).
- `GET /inspections/:inspectionId/:filename` — Foto dosyası (public).

## Controller’lar — İşlev Özeti
- `authController.js`: `loginValidation`, `login`, `logout`, `getProfile`, `checkPermission`.
- `companyController.js`: `getAllCompanies`, `getCompany`, `createCompany(+Validation)`, `updateCompany(+Validation)`, `deleteCompany`, `getCompanyProfile`.
- `customerCompanyController.js`: Liste/detay/oluştur/güncelle/sil + validasyon zincirleri.
- `equipmentController.js`: Liste/detay/tipler/oluştur/güncelle/şablon güncelle/sil.
- `inspectionController.js`: `createInspection(+Validation)`, `get/put`, `saveInspection`, `completeInspection`, `approveInspection`, `uploadInspectionPhotos`, `checkTimeSlotAvailability`.
- `offerController.js`: Liste/detay/CR(U)D, `approveOffer`, `sendOffer`, public `track/accept/decline`, `convertToWorkOrder(+Validation)` (müsait zaman dilimi arama ile çakışma engellenir), `deleteOffer`.
- `reportController.js`: `getReport`, `downloadReport` (dosya sistemi odaklı; imzasız yoksa canlı üretim fallback), `getPublicReport`, `getSigningData`, `signReport(+Validation)`, `prepareReportPdf`, `enqueueReportPrepare`, `getReportJobStatus`, `generateReportHTML`.
- `technicianController.js`: Liste/detay/oluştur/güncelle/sil, `updateTechnicianPermissions`, `updateTechnicianPassword`.
- `uploadController.js`: `uploadCompanyLogo`, `uploadInspectionPhotos`, `deleteInspectionPhoto`, `getUploadedFile`.

## Middleware
- `auth.js`: `Authorization: Bearer <JWT>` doğrulama; aktif teknisyeni firma adıyla birlikte yükler; JWT hataları için 401 döner.
- `permissions.js`: `PERMISSIONS` sabiti; `requirePermission` ve `requireAnyPermission` kontrolcüler; `superAdmin` baypas kuralı.
- `upload.js`: Multer disk depolama (logo ve muayene fotoğrafları), MIME filtreleri (`jpeg/png/gif/webp`), dosya boyut/adet limitleri, standart Multer hata eşlemeleri.

## Yardımcılar (Utils)
- `migrate.js`: `config/migrations/*.sql` dosyalarını alfabetik sırayla çalıştırır; bağlantı testi içerir.
- `pdfGenerator.js`: Puppeteer ile `generatePDFBufferFromHTML` ve `generatePDFFromHTML`; `PUPPETEER_NO_SANDBOX`, `PUPPETEER_HEADLESS`, `PUPPETEER_EXECUTABLE_PATH` desteği.
- `reportRenderer.js`: Bölüm türleri (`key_value`, `checklist`, `table`, `photos`, `notes`) ve legacy `sections[].fields` uyumluluğu; stiller; `buildHTML(report)` ile bütün sayfa üretimi.
- `reportWorker.js`: `report_jobs` kuyruğundan `pending` işleri `processing`e çeker, paralel işler, sonuçta `completed/failed` günceller; PDF’i `storage` ile yazıp `reports` tablosunda path’i günceller.
- `storage.js`: Rapor dizin/yol yardımcıları (`unsignedPdfPath`, `signedPdfPath`), `writeFileAtomic`, `fileExists`, `readFileBase64`.

## Veri Modeli ve Şema (Özet)
- `companies`: Firma bilgileri (`logo_url` dahil).
- `technicians`: Firma bağı, iletişim, `permissions` (JSONB dizi), `e_signature_pin`, `is_active`.
- `customer_companies`: Müşteri firmaları.
- `equipment`: Firma bağı, `type`, `template` (JSONB dinamik şablon).
- `offers`: `offer_number`, `items` (JSONB), `status`, müşteri kararı alanları (003), `tracking_token`, onay/gönderim zamanları.
- `work_orders`: `work_order_number`, `status`, müşteri firması/oluşturan ilişkileri, opsiyonel `offer_id`.
- `work_order_assignments`: İş emri ↔ teknisyen eşleştirmeleri (unik kısıt).
- `inspections`: İş emri/ekipman/teknisyen bağı, tarih-saat, `inspection_data` (JSONB), `photo_urls` (JSONB), `unique_time_slot`.
- `reports`: Muayene bağı, imza durumu/zamanı/kullanıcı, `qr_token`, `unsigned_pdf_path`/`signed_pdf_path` (005); base64 sütunları 006 ile kaldırılmış.
- `report_jobs`: PDF üretim kuyruğu; `status`, `attempts`, `priority`, zaman damgaları; tek aktif job unique index’i.

## Yapılandırma ve Ortam Değişkenleri
- DB: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- Uygulama: `PORT` (varsayılan 3000), `JWT_SECRET` (zorunlu).
- PDF: `PUPPETEER_NO_SANDBOX`, `PUPPETEER_HEADLESS`, `PUPPETEER_EXECUTABLE_PATH`.
- Rapor depolama: `REPORTS_PATH` (opsiyonel, yoksa `backend/uploads/reports`).
- Worker: `REPORT_WORKER_BATCH`, `REPORT_WORKER_DELAY_MS`.

## Güvenlik, Oransal Sınırlandırma ve Hata Yönetimi
- Kimlik: JWT zorunlu; `auth` middleware doğrular ve veritabanından aktif kullanıcıyı yükler.
- Yetki: İnce taneli izinler; `superAdmin` tüm işlemleri gerçekleştirebilir.
- Rate-limit: Auth/upload/genel için limiter tanımlı, geliştirmede devre dışı; prod’da aktifleştirilmesi önerilir.
- Hata: Controller’larda tutarlı JSON hata yanıtları; global 500 ve 404 handler.

## PDF Üretimi ve İş Kuyruğu
- Senkron: `POST /api/reports/:id/prepare` ve yoksa indirirken canlı üretim (`downloadReport`).
- Asenkron: `POST /api/reports/:id/prepare-async` job kuyruğu; `reportWorker.js` işler.
- Dosya Saklama: PDF’ler dosya sisteminde; yol alanları DB’de. Legacy base64 sütunları ve herhangi bir backfill mantığı kaldırıldı.

## Dosya Yükleme ve Sunum
- Yükleme: `upload.js` ile logo (`logo`) tek dosya, muayene fotoğrafları (`photos`) çoklu; tip/boyut/adet sınırları.
- Sunum: `GET /api/uploads/logos/:filename` ve `GET /api/uploads/inspections/:inspectionId/:filename` public. Güvenlik için imzalı URL/short‑lived token önerilir.

## Çalıştırma Talimatları
1) Önkoşullar: Node.js ≥ 18, npm ≥ 8, PostgreSQL ≥ 13.
2) Kurulum: `cd backend && npm install`.
3) Ortam: `.env` dosyasını (DB_* + `JWT_SECRET`) tanımlayın.
4) Migrasyon: `node utils/migrate.js` veya `npm run migrate`.
5) Çalıştırma: `npm run dev` (varsayılan `http://localhost:3000/api`).
6) Worker (opsiyonel): `node utils/reportWorker.js` ile PDF üretim kuyruğu.
7) Test: `scripts/test_backend.py` ile uçtan uca akış (çalışan API gerektirir).

## Riskler ve İyileştirme Önerileri
- Public dosya servis uçları tahmin saldırılarına açık olabilir → imzalı URL/TTL, yetkili proxy.
- Rate-limit prod’da zorunlu hale getirilmeli; IP/hesap bazlı farklı kotalar.
- İzinler JSONB dizi ile esnek; schema tabanlı RBAC (tablo + join) düşünülebilir.
- Puppeteer bağımlılıkları için container imajına gerekli paketler eklenmeli; `--no-sandbox` ihtiyacı değerlendirilmelidir.
- Rapor indirme dosya adı üretimi güvenli; yine de path traversal’a karşı kontroller sürdürülmelidir.

## Ekler

### `PERMISSIONS` Listesi (middleware/permissions.js)
```
companyAdmin, superAdmin,
viewTechnicians, createTechnician, editTechnician, deleteTechnician,
viewCustomers, createCustomer, editCustomer,
viewEquipment, createEquipment, editEquipment,
viewOffers, createOffer, editOffer, approveOffer, sendOffer,
viewWorkOrders, createWorkOrder, editWorkOrder, assignWorkOrder, updateWorkOrderStatus,
viewInspections, editInspection, saveInspection, completeInspection, uploadPhotos,
viewReports, downloadReports, signReports, sendReports,
viewDashboard, viewCalendar
```

### Veritabanı Tabloları (001_create_tables.sql — özet)
- `companies(id, name, tax_number, address, contact, logo_url, timestamps)`
- `technicians(id, company_id→companies, name, surname, email(unique), phone, password_hash, e_signature_pin, permissions JSONB[], is_active, timestamps)`
- `customer_companies(id, company_id→companies, name, tax_number, address, contact, email, authorized_person, timestamps)`
- `equipment(id, company_id→companies, name, type, template JSONB, is_active, timestamps)`
- `offers(id, company_id→companies, offer_number(unique), customer_company_id→customer_companies, status, items JSONB, notes, total_amount, tracking_token(unique), created_by→technicians, approved_by→technicians, approved_at/sent_at/viewed_at, timestamps)`
- `work_orders(id, company_id→companies, work_order_number(unique), customer_company_id→customer_companies, offer_id→offers, status, scheduled_date, notes, created_by→technicians, timestamps)`
- `work_order_assignments(id, work_order_id→work_orders, technician_id→technicians, assigned_at, UNIQUE(work_order_id, technician_id))`
- `inspections(id, work_order_id→work_orders, equipment_id→equipment, technician_id→technicians, inspection_date, start_time, end_time, status, inspection_data JSONB, photo_urls JSONB, unique_time_slot, timestamps)`
- `reports(id, inspection_id→inspections, is_signed, signed_at, signed_by→technicians, qr_token(unique), sent_at, unsigned_pdf_path, signed_pdf_path, timestamps)`
- `report_jobs(id, report_id→reports, status, attempts, last_error, priority, started_at, finished_at, timestamps)`

---

Bu rapor `backend/` altındaki tüm route, controller, middleware, utils ve SQL dosyalarının incelenmesiyle oluşturulmuştur. Daha ayrıntılı istek/yanıt şemaları (OpenAPI/Postman), izin matrisi tablosu veya ER diyagramı isterseniz ekleyebilirim.

## End‑to‑End Akış (Öncelik 1)

```
Teklif (offers)
  POST /offers → Teklif oluştur
  POST /offers/:id/approve → Onay (iç)
  POST /offers/:id/send → Müşteriye gönder (tracking_token)
  POST /offers/track/:token/accept → Müşteri kabul (public)

İş Emri (work_orders)
  POST /offers/:id/convert-to-work-order → İş emri + Muayene(ler)

Muayene (inspections)
  GET /inspections?workOrderId=... → Muayene ID öğren
  PUT /inspections/:id → Veri güncelle (inspection_data)
  POST /inspections/:id/photos → Foto yükle
  POST /inspections/:id/save → Rapor kaydı oluştur/güncelle
  POST /inspections/:id/complete → Muayeneyi tamamla

Rapor (reports)
  POST /reports/:id/prepare (veya /prepare-async) → İmzasız PDF üret
  GET /reports/:id/signing-data → İmzaya hazır PDF (base64)
  POST /reports/:id/sign → İmzala (PIN + signedPdfBase64)
  GET /reports/:id/download[?signed=true] → PDF indir
  GET /reports/public/:qrToken → Public görüntüleme (imzalı gerektirir)
```

## Örnek İstek/Yanıtlar (Öncelik 1)

- `POST /api/offers/:id/convert-to-work-order`
  - İstek: `{ "scheduledDate": "2025-12-01", "notes": "Tekliften" }`
  - Yanıt (201): `{ "success": true, "data": { "id": 123, "work_order_number": "WO-123456789", "status": "not_started", ... } }`
  - Not: Çakışma varsa sistem uygun günü bularak muayeneleri üretir (09:00–17:00).

- `POST /api/inspections/:id/save`
  - İstek: gövde gerektirmez; kimlik/izin gerekir.
  - Yanıt (200): `{ "success": true, "data": { "inspection": { ... }, "report": { "id": 10, "qr_token": "..." } } }`

- `POST /api/inspections/:id/complete`
  - Yanıt (200): `{ "success": true, "message": "Muayene tamamlandı" }`

- `POST /api/reports/:id/prepare`
  - Yanıt (200): `{ "success": true, "message": "Rapor PDF oluşturuldu", "data": { "reportId": 10 } }`

- `POST /api/reports/:id/prepare-async`
  - Yanıt (202): `{ "success": true, "data": { "jobId": 7, "status": "pending" } }`
  - `GET /api/reports/jobs/:jobId` → `{ "success": true, "data": { "status": "completed" } }`

- `GET /api/reports/:id/signing-data`
  - Yanıt (200): `{ "success": true, "data": { "pdfBase64": "JVBERi0xLjQK..." } }`

- `POST /api/reports/:id/sign`
  - İstek: `{ "pin": "123456", "signedPdfBase64": "JVBERi0xLjQK..." }`
  - Yanıt (200): `{ "success": true, "data": { "id": 10, "is_signed": true, "signed_pdf_path": "/.../reports/10/signed.pdf" } }`

- `GET /api/reports/:id/download?signed=false|true`
  - Yanıt: `Content-Type: application/pdf` dosya.

## İzin Matrisi (Öncelik 1)

- Auth: profile → auth (ek izin yok)
- Companies: list/create/delete → `superAdmin`; get/update → `companyAdmin`
- Customer Companies: list/get → `viewCustomers`; create → `createCustomer`; update → `editCustomer`; delete → any(`companyAdmin`,`editCustomer`)
- Equipment: list/get/types → `viewEquipment`; create → `createEquipment`; update/template → `editEquipment`; delete → any(`companyAdmin`,`editEquipment`)
- Offers: list/get → `viewOffers`; create → `createOffer`; update → `editOffer`; approve → `approveOffer`; send → `sendOffer`; convert-to-work-order → `createWorkOrder`; delete → any(`companyAdmin`,`editOffer`)
- Work Orders: list/get → `viewWorkOrders`; create → `createWorkOrder`; update → `editWorkOrder`; assign → `assignWorkOrder`; status → `updateWorkOrderStatus`; delete → any(`companyAdmin`,`editWorkOrder`)
- Inspections: list/get → `viewInspections`; create → `createWorkOrder`; update → `editInspection`; save → `saveInspection`; complete → `completeInspection`; approve → `companyAdmin`; photos → `uploadPhotos`
- Reports: get/prepare/prepare-async/jobs → `viewReports`; download → `downloadReports`; signing-data/sign → `signReports`; send → `sendReports`; public (`/public/:qrToken`) → no auth

## PDF Depolama Düzeni (Öncelik 1)

- Kök: `REPORTS_PATH` (yoksa `backend/uploads/reports`)
- Yapı: `<REPORTS_PATH>/<report_id>/unsigned.pdf` ve `<REPORTS_PATH>/<report_id>/signed.pdf`
- Örnek: `/.../backend/uploads/reports/11/unsigned.pdf`
- Davranış:
  - İmzasız PDF yoksa `prepare` ile üretilir; indirme esnasında da otomatik üretim yapılabilir.
  - İmzalama `POST /reports/:id/sign` ile `signed.pdf` yazılır, `reports.signed_pdf_path` güncellenir.
  - İmzadan sonra imzasız dosya da saklanır (iş gereklerine göre silme/temizleme politikası eklenebilir).

## Migrasyon Notu (Öncelik 1)

- 001 şemasından `unsigned_pdf_base64` ve `signed_pdf_base64` kaldırıldı; yeni kurulumlarda bu kolonlar oluşmaz.
- 006 migration (DROP COLUMN IF EXISTS) korunuyor; eski DB’lerde güvenli şekilde kolonları temizlemek için kullanılabilir.
- Geçiş önerisi:
  1) Eksik dosya yolu var mı kontrol et: `SELECT COUNT(*) FROM reports WHERE unsigned_pdf_path IS NULL OR (is_signed AND signed_pdf_path IS NULL);`
  2) Gerekirse `prepare`/`download` ile imzasız, `sign` akışıyla imzalı üret.
  3) `psql -U postgres -d <DB> -f backend/config/migrations/006_drop_base64_columns.sql` çalıştır.
