# Backend (Express + PostgreSQL) — Mimarî ve Uygulama Kılavuzu

Bu belge, arka uç katmanının mimarisini, modüllerini, veri modelini, akışları, güvenlik yaklaşımını ve geliştirme pratiklerini ayrıntılı açıklar.

## 1. Mimarî Genel Bakış
- Çatı: Node.js 18+, Express 4.
- Katmanlar: Routes → Middleware → Controllers → Utils → DB (pg Pool) → Dosya Sistemi.
- Veri: PostgreSQL, JSONB yoğun kullanım (template ve inspection_data).
- Dosya Depolama: Rapor PDF’leri ve fotoğraflar dosya sisteminde (path DB’de).
- İmza: Yerel imzalayıcı ile istemci tarafında, backend’e imzalı PDF geri yazılır.

```
Request → Router → Auth (JWT) → Permission → Controller → DB / Storage → Response
```

## 2. Klasör Yapısı
- `backend/app.js`: Uygulama girişi, helmet/cors/morgan, route mount, hata yakalama.
- `backend/config/database.js`: pg Pool ve .env yapılandırması.
- `backend/config/migrations/*.sql`: SQL göçleri. (Bkz. database.md)
- `backend/controllers/*.js`: İş kuralları ve endpoint handler’ları.
- `backend/middleware/*.js`: auth (JWT), permissions, upload (multer).
- `backend/routes/*.js`: Modül bazlı router’lar (auth, offers, workOrders, inspections, reports, uploads, ...).
- `backend/utils/*`: migrate.js, pdfGenerator.js (Puppeteer), reportRenderer.js, storage.js, reportWorker.js.
- `backend/uploads/*`: Çalışma zamanı dosya kökü (logos, inspections, reports).

## 3. Önemli Modüller

### 3.1 Auth
- JWT tabanlı auth. `Authorization: Bearer <token>`.
- `controllers/authController.js` login/getProfile; `middleware/auth.js` token doğrulama.

### 3.2 Permissions
- `middleware/permissions.js` `requirePermission/requireAnyPermission` ve `PERMISSIONS` listesi.
- superAdmin bypass uygular.

### 3.3 Uploads
- Multer ile yükleme: şirket logo ve muayene fotoğrafları.
- Uçlar: `POST /api/uploads/company-logo`, `POST /api/uploads/inspection-photos/:inspectionId`.
- Servis: `GET /api/uploads/logos/:filename`, `GET /api/uploads/inspections/:inspectionId/:filename`.
- Güvenlik: Path traversal kontrolü (uploads kökünde kalma), helmet CORP `cross-origin` (dev için).

### 3.4 Offers
- CRUD + approve/send/convert-to-work-order.
- `convert-to-work-order` işleminde iş emri ve muayeneler otomatik üretilir (INSP‑... numara verilir).

### 3.5 Work Orders
- CRUD + assign/status + ayrıntılı liste (assignedTechnicians, inspection sayıları).
- Durum kuralları (completed→approved→sent). Tamamlanmamış muayene varken completed yapılamaz.

### 3.6 Inspections
- JSONB `inspection_data` ve `photo_urls` yönetimi.
- `save` → rapor kaydı; `complete` → required alan validasyonu + eski PDF yollarını temizleyip unsigned üretimi deneme.
- `uploadPhotos` → foto ekleme, gerekirse `inspection_data[fieldName]`’e push.
- `check-availability` → teknisyen/time slot çakışma kontrolü.

### 3.7 Reports
- Prepare (senkron) / Prepare‑Async (job worker) → unsigned.pdf.
- `GET /signing-data` → base64; `POST /sign` → signed.pdf.
- `GET /download?signed=...` → PDF servis.
- `GET /public/:qrToken` → imzalı rapor public.

## 4. Veri Doğrulama ve Hata Modeli
- express‑validator kullanımı (create/update uçlarında).
- Tutarlı hata modeli:
```
{ success: false, error: { code, message, details? } }
```
- Yaygın durumlar: 400 (VALIDATION_ERROR), 401, 403, 404, 409 (CONFLICT), 422 (iş kuralı/uyuşmazlık).

## 5. PDF Üretim Hattı
- `utils/reportRenderer.js` şablon + inspection_data + foto’ları HTML’e dönüştürür (typed & legacy).
- `utils/pdfGenerator.js` Puppeteer ile HTML→PDF. Tercihen Buffer döndürülür (`generatePDFBufferFromHTML`). Tek bir Puppeteer instance'ı yeniden kullanılır (singleton) ve sayfalar iş bitince kapatılır.
- `controllers/reportController.downloadReport()` senaryosu:
  - İstenen (signed/unsigned) dosya yolu yoksa, HTML’den PDF Buffer üretilir ve `writeFileAtomic` ile yazılır.
  - `resolvePdfPath` imzalı dosyayı öncelikli olarak seçer; yoksa otomatik imzasız PDF’e düşer ve gerekirse yeniden üretir.
  - İndirme öncesi dosyanın ilk baytları kontrol edilir: `%PDF-` değilse; base64 içerikse decode edilip düzeltilir; unsigned için gerekirse yeniden üretilir.
  - Content-Disposition başlığı RFC 5987’e uygun ve güvenli olacak şekilde oluşturulur (ASCII fallback + `filename*` UTF‑8).
- `utils/storage.js` rapor dosya yollarını üretir ve atomik yazımı yapar.
- İmzalı/İmzasız dosyalar: `REPORTS_PATH/<report_id>/unsigned.pdf|signed.pdf`.

### 5.1 Performans ve Bellek İyileştirmeleri
- Puppeteer Yeniden Kullanımı: Her çağrıda yeni browser açmak yerine tek bir browser instance paylaşılarak sayfa bazlı (page) kullanım yapılır. Bu, hem CPU hem RAM tüketimini ve ilk bayt gecikmesini düşürür.
- PDF Doğrulama Onarımı Eşiği: Bozuk dosya onarımında (base64→binary) dosya boyutu `PDF_BASE64_REPAIR_MAX_BYTES` (varsayılan 30MB) üzerindeyse RAM’e almaktan kaçınılır; unsigned ise doğrudan yeniden üretim denenir.

## 6. Güvenlik
- JWT, permission kontrolleri, rate-limit (dev’de kapalı tutulabilir), helmet, CORS.
- Upload servisinde path traversal korumaları, Content-Type seçimi, uzun cache kontrolü.
- Public uçlar: teklif tracking (accept/decline), rapor public (metadata + PDF indirme; imzalı yoksa otomatik imzasız PDF servis edilir).

## 7. Çalıştırma ve Geliştirme
- .env: DB_*, JWT_SECRET, REPORTS_PATH, PUPPETEER_*, REPORT_PUBLIC_BASE_URL (`http://host/reports/public` taban adresi; QR kodu bu URL ile üretir).
- `npm run migrate` (veya `MIGRATE_ONLY=007` gibi seçimli).
- `npm run dev` → API `http://localhost:3000/api`.
- Worker: `node utils/reportWorker.js` (async prepare için).

## 8. Yaygın Akışlar (Backend Perspektifi)
- Tekliften iş emrine dönüşüm → transaction içinde iş emri + muayene(ler) + slot tahsisi (gerekirse ileri tarih arama).
- Muayene tamamla → validasyon, rapor yollarını sıfırla, unsigned üretimine çalış.
- İmza → base64 hazırla, yerelde imzala, signed.pdf yaz.

## 9. Değişiklikler ve Migrasyonlar
- 007_add_inspection_number.sql: `inspections.inspection_number` (benzersiz) eklendi, backfill ve unique kısıt.
- `migrate.js` tek migrasyon veya belirli bir eşikten çalıştırılabilir (MIGRATE_ONLY / MIGRATE_FROM veya CLI argümanı).

## 10. Genişletme Önerileri
- Template editor (görsel) için backend’de şablon şema doğrulama genişletmesi ve snippet katalogları.
- Rapor versiyonlama ve geçmiş PDF arşivlemesi.
- Background job kuyruğunda retry/backoff ve metrikler.
