# Frontend (React + Vite + MUI) — Mimari ve Geliştirme Rehberi

Bu belge, ön yüzün mimarisini, rotalarını, modüllerini, ortak bileşenlerini ve geliştirme pratiklerini açıklar.

## 1. Teknoloji Yığını
- React 18 + Vite
- MUI v5 (tema, bileşen kütüphanesi)
- Redux Toolkit + RTK Query (api cache, baseApi + tag invalidation)
- React Router v6 (guarded routes)
- notistack (toast)
- date-fns (TR tarih)

## 2. Klasör Yapısı
```
frontend/
  src/
    components/
      layout/ (AppLayout, Sidebar, PageHeader)
      routing/ (ProtectedRoute, PermissionRoute)
      common/ (DataTable)
    features/
      auth/ (LoginPage, authApi)
      customers/ (CustomersPage, customersApi)
      equipment/ (EquipmentPage, equipmentApi)
      offers/ (OffersPage, OfferDetailPage, offersApi)
      workOrders/ (WorkOrdersPage, WorkOrderDetailPage, workOrdersApi)
      inspections/
        (InspectionsPage, InspectionDetailPage,
         InspectionFormPage, InspectionPhotosPage, InspectionReportPage,
         components/TableFieldEditor.tsx,
         inspectionsApi)
    store/ (store.ts, baseApi, slices)
    hooks/ (usePermission, useToast)
    constants/ (nav, permissions)
    theme/ (theme.ts)
    utils/ (date.ts, format.ts)
```

## 3. Rotalar ve Guard Yapısı
- Public: `/login`, `/reports/public/:token`
- Protected: `/dashboard` ve tüm modüller
- PermissionRoute: rota düzeyinde izin kontrolü
- PermissionGuard: buton/aksiyon görünürlüğü için
- AuthInitializer: token varsa profil hydrate edilene kadar redirect yapma (flicker fix)

## 4. Modül Özeti
- Customers, Equipment, Technicians: CRUD listeleri, arama/sayfalama, dialog formlar, izinli aksiyonlar
  - Technicians izin dialogunda `viewMyWorkOrders`, `viewMyInspections` gibi teknisyen-odaklı izinler atanarak menüde “Benim …” sayfaları aktif edilir.
- Equipment: görsel Template Builder ile şablon düzenleme (JSON’suz)
- Offers: liste/detay, approve/send/convert, durum rozetleri
- Work Orders: liste/detay, assign/status, inspections özetleri
- MyWorkOrders: teknisyenlere özel filtrelenmiş liste (atandığım iş emirleri, inline filtre/yenile)
- Inspections:
  - list: iş emri/müşteri/ekipman/teknisyen/tarih/status/rapor durumları
  - detail: özet + sekmelere geçiş
  - form: dinamik renderer (typed + legacy), TableFieldEditor, saat/tarih alanları, local validasyon, PUT + save/complete
  - photos: alan bazlı upload, foto önizleme/silme, path normalize
  - report: inline PDF önizleme (imzalı → imzasız fallback), prepare/prepare-async (job polling), ölçek seçimi, tek tuş indir, signer ile imzalama
- MyInspections: teknisyene atanmış muayeneleri tarih/durum filtresiyle listeler

## 5. Dinamik Form Renderer (InspectionFormPage)
- key_value → items[name,valueType] → Text/Number/Date/Select
- checklist → questions → Select
- table → TableFieldEditor; inspection_data[field] = array of rows
- photos → inspection_data[field] grid; upload için Photos sayfasına yönlendirir
- notes → Textarea
- Saat normalizasyonu: `HH:MM:SS` → `HH:MM`; regex doğrulaması `HH:MM` (backend ile uyum)

### 5.1 Template Builder (Equipment)
- Amaç: Son kullanıcının JSON yazmadan ekipman şablonu oluşturabilmesi.
- Bölüm tipleri: key_value, checklist, table, photos, notes.
- Ürettiği şema InspectionFormPage ile birebir uyumlu:
  - key_value → items[name,label,valueType(=text|number|date|select), options?, required?]
  - checklist → questions[name,label,options]
  - table → field, columns[name,label,type]
  - photos → field, maxCount?
  - notes → field
- Nerede: Equipment listesinde satırdaki “Şablon” butonu; ayrıca “Yeni Ekipman” dialogunda açılabilir.
- Kod: `frontend/src/features/equipment/TemplateBuilderDialog.tsx`

## 6. RTK Query
- `baseApi`: baseUrl + `prepareHeaders` ile JWT ekleme, 401 → logout
- Taglar: Offers, WorkOrders, Inspections, Reports, Customers, Equipment, Technicians
- Slice örnekleri: `offersApi.listOffers`, `workOrdersApi.updateStatus`, `inspectionsApi.listInspections`

## 7. Tema ve Layout
- AppLayout (AppBar + Sidebar). Sidebar desktop’ta collapse/expand (persist), mobilde temporary.
- Container `xl`. PageHeader ile başlık + aksiyon alanı.
- TR tarih formatı (`date-fns`), TL para (`toLocaleString('tr-TR',{currency:'TRY'})`).

## 8. Hata Yönetimi
- RTK Query → `isError`, `error.data.message` öncelikli gösterim.
- Form submit: `res.ok` kontrolü ve backend `error.message`’ı aynen iletme.
- Saat alanları için alan-altı (helperText) uyarıları.

## 9. En İyi Uygulamalar
- UI’da izinler yalnızca görünürlüğü belirler; asıl kontrol backend.
- Query parametrelerini (örn. photos?field=...) iş akışı için kullan.
- Büyük listelerde DataTable + server-side arama/sayfalama.

## 10. Geliştirme ve Çalıştırma
- `npm ci && npm run dev`
- `.env`: `VITE_API_BASE_URL=http://localhost:3000/api`
- Login test: superadmin@abc.com / password (veya admin@abc.com)

## 11. Genişletme Önerileri
- Equipment için görsel Template Editor (section/field sürükle-bırak)
- Public rapor sayfasına QR kod tarayıcı / rapor doğrulama flow’u
- E2E (Playwright/Cypress) kritik akışlar
