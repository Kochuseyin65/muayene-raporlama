# Dosya Haritası (Repo İçeriği)

Bu belge, repodaki tüm dosya ve klasörlerin amacını ve bağlamını açıklar.

## Kök Dizin
- `README.md` — Kısa proje özeti ve çalışma talimatları
- `CODEBASE_REPORT.md` — Kaynak dosyaları incelemesine dayalı en güncel mimarî rapor
- `FRONTEND_DEVELOPMENT_PLAN.md` — Ön yüz geliştirme planı ve fazlar
- `signer.md` — Yerel e‑imza istemcisine dair notlar ve örnek kod
- `doc.md`, `PROJE_DOKUMANTASYONU.md` — Eski/yardımcı dokümanlar
- `docs/` — Bu dokümantasyon klasörü (ayrıntılar için docs/README.md)
- `scripts/` — Yardımcı scriptler (ör. backend E2E, örnek ekipman üretme)
- `backend/` — Express API (aşağıda)
- `frontend/` — React uygulaması (aşağıda)

## backend/
- `app.js` — Express bootstrap; helmet/cors/morgan; route mount; hata/404 handler
- `config/database.js` — pg Pool ve bağlantı konfigürasyonu
- `config/migrations/*.sql` — SQL migrasyonları (001…007)
- `controllers/*.js` — Modül controller’ları (auth/company/offer/workOrder/inspection/report/upload/equipment/technician)
- `middleware/auth.js` — JWT doğrulama
- `middleware/permissions.js` — Permission kontrolleri ve PERMISSIONS sabiti
- `middleware/upload.js` — Multer storage ve fileFilter
- `routes/*.js` — Kaynak router’ları (REST uçları)
- `utils/migrate.js` — Migrasyon koşucu (seçimli çalıştırma desteği vardır)
- `utils/pdfGenerator.js` — Puppeteer ile PDF üretimi
- `utils/reportRenderer.js` — Template + inspection_data + foto → HTML
- `utils/storage.js` — Rapor dosya yolları ve güvenli dosya yazma
- `utils/reportWorker.js` — Async prepare işçisi
- `uploads/` — Çalışma zamanı dosya kökü (logos/, inspections/, reports/)

## frontend/
- `index.html` — Vite entry
- `src/main.tsx` — React bootstrap + SnackbarProvider
- `src/App.tsx` — Router ve tema sağlayıcı (getAppTheme)
- `src/theme/theme.ts` — MUI tema
- `src/store/store.ts`, `src/store/api/baseApi.ts`, slices — Redux Toolkit store; RTK Query baseApi
- `src/components/layout/*` — AppLayout, Sidebar (collapse/expand), PageHeader
- `src/components/routing/*` — ProtectedRoute (auth), PermissionRoute (izin), AuthInitializer (profile hydrate)
- `src/components/common/DataTable.tsx` — Liste şablonu
- `src/features/*` — Modül dizinleri
  - `auth/` — LoginPage, authApi
  - `customers/`, `equipment/`, `technicians/` — CRUD sayfaları ve slice’ları
    - `equipment/TemplateBuilderDialog.tsx` — Ekipman şablonu için görsel düzenleyici
  - `offers/` — OffersPage, OfferDetailPage, offersApi
  - `workOrders/` — WorkOrdersPage, WorkOrderDetailPage, MyWorkOrdersPage, workOrdersApi
  - `inspections/` — InspectionsPage, InspectionDetailPage, InspectionForm/Photos/ReportPage, MyInspectionsPage, TableFieldEditor, inspectionsApi
  - `reports/` — ReportPublicPage, paylaşılan PDF önizleme bileşenleri ve fetch yardımcıları
- `src/constants/*` — nav (Sidebar menüsü), permissions listesi
- `src/utils/*` — date (TR tarih), format (TL para)

## scripts/
- `test_backend.py` — E2E test scripti (çalışan API gerektirir)
- `create_example_equipment.py` — Zengin template sahibi örnek ekipman oluşturur (login + POST /equipment)

## docs/
Bu klasörün içeriği için bkz. `docs/README.md` ve diğer alt belgeler.
