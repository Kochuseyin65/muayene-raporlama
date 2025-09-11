# Muayene ve Raporlama Sistemi - Frontend Geliştirme Planı

Bu doküman, projenin frontend katmanını geliştirmek için detaylı bir yol haritası ve planlama belgesidir.

## 1. Genel Bakış ve Teknoloji Yığını

### 1.1. Proje Hedefleri
- **Kullanıcı Dostu Arayüz:** Karmaşık iş akışlarını basitleştiren, temiz ve modern bir tasarım.
- **Mobil Uyumlu (Responsive):** Tüm cihazlarda (desktop, tablet, mobil) sorunsuz çalışan bir arayüz.
- **Performans:** Hızlı yüklenen ve akıcı çalışan bir Single Page Application (SPA).
- **Güvenli:** Yetkilendirme kurallarına tam uyumlu, kullanıcı rollerine göre dinamik olarak şekillenen bir arayüz.
- **Modüler ve Genişletilebilir:** Yeni özelliklerin kolayca eklenebileceği bir kod yapısı.

### 1.2. Teknoloji Yığını
- **Framework:** React.js 18+ (Vite ile)
- **UI Kütüphanesi:** Material-UI (MUI) v5 - Kapsamlı, özelleştirilebilir ve profesyonel component seti.
- **State Yönetimi:** Redux Toolkit (RTK) ve RTK Query (API state yönetimi ve caching için).
- **Routing:** React Router v6.
- **Form Yönetimi:** React Hook Form (Performanslı ve esnek formlar için).
- **API İstemcisi:** Axios (Interceptor'lar ile merkezi istek/yanıt yönetimi için).
- **Styling:** MUI (sx prop, styled-components) ve Emotion.
- **İkonlar:** Material Icons.
- **Grafikler:** Recharts (Dashboard için).
- **Bildirimler:** Notistack (Snackbar/Toast bildirimleri için).
- **Tarih/Zaman:** date-fns.

## 2. Proje Yapısı

```
frontend/
├── public/
├── src/
│   ├── assets/             # Resimler, fontlar vb.
│   ├── components/         # Yeniden kullanılabilir, genel component'ler
│   │   ├── common/         # Buton, Modal, DataTable gibi genel amaçlı component'ler
│   │   ├── layout/         # AppLayout, Sidebar, Header gibi sayfa düzeni component'leri
│   │   └── forms/          # FormField, ControlledSelect gibi form elemanları
│   ├── constants/          # Sabitler (örn: PERMISSIONS, navMenu)
│   ├── features/           # Özellik bazlı modüller
│   │   ├── auth/           # Login, parola sıfırlama vb.
│   │   ├── dashboard/      # Ana gösterge paneli
│   │   ├── companies/      # Firma yönetimi (SuperAdmin için)
│   │   ├── customers/      # Müşteri firma yönetimi
│   │   ├── equipment/      # Ekipman ve şablon yönetimi
│   │   ├── inspections/    # Muayene formları ve listeleri
│   │   ├── offers/         # Teklif yönetimi
│   │   ├── reports/        # Rapor görüntüleme ve imzalama
│   │   ├── technicians/    # Teknisyen yönetimi
│   │   └── workOrders/     # İş emri yönetimi
│   ├── hooks/              # Custom hook'lar (örn: usePermission)
│   ├── services/           # API servis katmanı (Axios instance ve interceptor'lar)
│   ├── store/              # Redux store
│   │   ├── api/            # RTK Query API slice'ları
│   │   └── slices/         # Standart Redux slice'ları (authSlice, uiSlice)
│   ├── theme/              # MUI tema konfigürasyonu (renkler, tipografi)
│   ├── utils/              # Yardımcı fonksiyonlar
│   ├── App.jsx             # Ana uygulama component'i ve router yapısı
│   └── main.jsx            # Uygulama giriş noktası
└── package.json
```

## 3. State Yönetimi Mimarisi

### 3.1. Auth Slice (`authSlice.js`)
- **State:** `user`, `token`, `isAuthenticated`, `isLoading`
- **Actions:** `setCredentials`, `logout`
- **Amacı:** Kullanıcı ve token bilgilerini saklar, uygulama genelinde kimlik durumunu yönetir.

### 3.2. UI Slice (`uiSlice.js`)
- **State:** `isSidebarOpen`, `theme ('light'|'dark')`, `modal: { open: false, type: null, data: {} }`
- **Actions:** `toggleSidebar`, `setTheme`, `openModal`, `closeModal`
- **Amacı:** Genel arayüz durumlarını (sidebar, tema, modal pencereler) yönetir.

### 3.3. RTK Query API Slices
- Her ana kaynak için ayrı bir API slice oluşturulacak (`technicianApi.js`, `offerApi.js` vb.).
- **Özellikleri:**
  - Otomatik caching ve re-fetching.
  - `providesTags` ve `invalidatesTags` ile cache'in otomatik güncellenmesi.
  - `isLoading`, `isSuccess`, `isError`, `data` gibi durumları otomatik yönetir.

## 4. Ana Modüllerin Planı

*(Bu bölüm, her bir özelliğin genel sorumluluklarını listeler. Detaylar 5. bölümde olacaktır.)*

- **Auth:** Kullanıcı giriş/çıkış işlemleri.
- **Layout:** Uygulamanın ana iskeleti, menü ve başlık çubuğu.
- **Dashboard:** Rol bazlı özet bilgiler ve grafikler.
- **Technician Management:** Teknisyen listeleme, ekleme, düzenleme ve yetkilendirme.
- **Customer Management:** Müşteri firma listeleme ve CRUD işlemleri.
- **Equipment Management:** Ekipman ve dinamik muayene şablonu yönetimi.
- **Offer Management:** Teklif oluşturma, listeleme, onaylama ve iş emrine dönüştürme.
- **Work Order Management:** İş emri listeleme, teknisyen atama ve durum takibi.
- **Inspection Management:** Dinamik muayene formu, veri girişi ve fotoğraf yükleme.
- **Report Management:** PDF rapor görüntüleme ve e-imza süreci.

## 5. Sayfa ve Component Detayları

*(Bu bölümü birlikte adım adım dolduracağız.)*

### 5.1. Authentication (`/login`)
- **URL:** `/login`
- **Görevi:** Kullanıcıların e-posta ve şifre ile sisteme giriş yapmasını sağlar.
- **API Endpoint'leri:** `POST /api/auth/login`
- **Component'ler:**
  - `LoginPage.jsx` (Ana sayfa container'ı)
  - `LoginForm.jsx` (Form elemanlarını ve mantığını içerir)
- **State ve Logic:**
  - Form state (React Hook Form ile).
  - `isLoading` durumu (Butonda loading spinner göstermek için).
  - Başarılı girişte token'ı local storage'a kaydetme ve Redux'a kullanıcı bilgilerini aktarma.
  - Başarısız girişte hata mesajı gösterme.

---

## 6. Geliştirme Yol Haritası

1.  **Faz 1: Temel Kurulum ve Kimlik Doğrulama**
    - Proje iskeletini oluşturma (Vite).
    - Kütüphaneleri kurma (MUI, Redux, Router).
    - Klasör yapısını oluşturma.
    - Tema ve temel layout component'lerini (Sidebar, Header) oluşturma.
    - Login sayfası ve auth akışını tamamlama.
    - Protected Route (yetkisiz erişimi engelleyen) yapısını kurma.
    - PermissionGuard + `usePermission` ile izinli aksiyonları UI’da koşullu gösterme.

2.  **Faz 2: Ana CRUD Modülleri**
    - Genel `DataTable` component'ini oluşturma (sıralama, filtreleme, sayfalama).
    - Global toast/hata deseni (notistack) ve 401/403/409/422 için ortak handler.
    - Müşteri firma (Customer Companies) yönetimi sayfası (CRUD).
    - Ekipman (Equipment) listeleme sayfası (CRUD, ileride template edit).
    - Teknisyen (Technicians) yönetimi sayfası (CRUD).

3.  **Faz 3: İş Akışı Modülleri**
    - Teklif oluşturma ve listeleme.
    - İş emri oluşturma ve listeleme.
    - Tekliften iş emri oluşturma akışı.
    - Detay sayfaları (OfferDetail, WorkOrderDetail).

4.  **Faz 4: Muayene ve Raporlama**
    - Dinamik muayene formu (`DynamicInspectionForm`) component'ini geliştirme.
    - Muayene verilerini kaydetme ve güncelleme.
    - Rapor görüntüleme sayfası (PDF viewer entegrasyonu).
    - Rapor prepare + prepare-async (job polling: pending/processing/completed/failed durum göstergeleri).
    - E-imza akışının entegrasyonu.

5.  **Faz 5: Tamamlama ve İyileştirme**
    - Dashboard sayfalarını rol bazlı oluşturma.
    - Mobil uyumluluk testleri ve iyileştirmeleri.
    - Performans optimizasyonları (code splitting, memoization).
    - Kapsamlı testler.

### 7.11.1. Kabul Kriterleri (Özet)
- Faz 1
  - Login `POST /auth/login` → token saklanır, `GET /auth/profile` sonrası ProtectedRoute çalışır.
  - PermissionGuard ile izin verilmeyen butonlar/aksiyonlar gizlenir (backend 403 yine kontrol eder).
- Faz 2
  - DataTable: sayfalama/filtre/sıralama; RTK Query tag invalidation çalışır.
  - Global toast/hata: 401→logout, 403→uyarı, 409/422→form alanı altı + toast.
  - Customers/Equipment/Technicians CRUD sayfaları tamam ve tutarlı UI deseni kullanır.
- Faz 3
  - Offers CRUD + approve/send/convert-to-work-order; durum rozetleri; WO oluşumu doğrulanır.
  - Work Orders liste/detay; assign ve status güncellemeleri.
- Faz 4
  - Inspections list/detail; DynamicInspectionForm şablondan alan render eder; photos upload/preview; save/complete çalışır.
  - Reports prepare/prepare-async: job polling ile durum göstergesi; indirme/önizleme.
  - E-imza: signing-data → local signer → sign; signed.pdf indirilir/gösterilir.
- Faz 5
  - Dashboard kartları (açık teklifler, yaklaşan iş emirleri, bekleyen imza/raporlar).
  - Public sayfalar: `/offers/track/:token` ve `/reports/public/:qrToken` erişilebilir ve doğru veri gösterir.
  - Performans (code splitting) ve mobil uyum iyileştirmeleri.

## 7. Netleştirilmiş Plan (CODEBASE_REPORT Doğrulandı)

Bu bölüm, FRONTEND_DEVELOPMENT_PLAN.md ve to-start-project.md içeriğini CODEBASE_REPORT.md ile doğrulayarak netleştirir. Çakışan yerlerde CODEBASE_REPORT.md esas alınmıştır.

### 7.1. Varsayımlar ve Karar Noktaları
- Stack: React 18 + Vite, React Router v6, Redux Toolkit + RTK Query, Axios.
- .env: `VITE_API_BASE_URL=http://localhost:3000/api` (geliştirmede backend varsayılanı).
- Yetki: UI’da izinli aksiyonları göster, asıl kontrol backend’dedir (granüler permission’lar).
- Karar noktaları (onay bekliyor):
  - UI kütüphanesi: MUI (tercih) vs Tailwind (alternatif).
  - Dil: TypeScript kullanılacak mı? (Tercihen evet; yoksa JS ile ilerlenebilir.)

### 7.2. Endpoint Eşleme (CODEBASE_REPORT’a göre)
- Auth: `POST /api/auth/login`, `GET /api/auth/profile`.
- Offers → Work Order: `POST /api/offers/:id/convert-to-work-order`.
- Inspections uygunluk: `GET /api/inspections/check-availability`.
- Reports indirme: `GET /api/reports/:id/download?signed=false|true`.
- Public report: `GET /api/reports/public/:qrToken`.

Not: to-start-project.md içinde bazı kısa/alternatif path’ler geçebilir; yukarıdaki yollar kesin ve günceldir.

### 7.3. Rotalar
- Public
  - `/login` — Giriş
  - `/offers/track/:token` — Teklif takip (public)
  - `/reports/public/:qrToken` — İmzalı rapor görüntüleme (public)
  - `/404`
- Protected
  - `/dashboard`
  - `/profile`
  - `/admin/companies` (Super Admin)
  - `/technicians`
  - `/customers`
  - `/equipment`
  - `/offers`
  - `/work-orders`
  - `/inspections`
  - `/reports`
  - `/settings/company`

### 7.4. Çekirdek Uygulama Yapısı
- Layout: `AppLayout` (Sidebar + Header), `ProtectedRoute`, `PermissionGuard`.
- Store: `authSlice` (user, token), `uiSlice` (tema/sidebar), `baseApi` (RTK Query).
- Hooks: `useAuth`, `usePermission(permission: string)`.
- Constants: `PERMISSIONS` (CODEBASE_REPORT listesini temel alın).

### 7.5. Modül Bazlı Plan ve İzinler
- Auth
  - `POST /auth/login`, `GET /auth/profile`, ayrıca `GET /companies/profile` (kullanıcının firması).
- Companies (Super Admin odaklı)
  - `GET /companies` (superAdmin), `GET /companies/:id` (companyAdmin|superAdmin),
    `POST /companies` (superAdmin), `PUT /companies/:id` (companyAdmin), `DELETE /companies/:id` (superAdmin).
- Customer Companies
  - Liste/Detay: `GET /customer-companies[/:id]` (viewCustomers)
  - Oluştur: `POST /customer-companies` (createCustomer)
  - Güncelle: `PUT /customer-companies/:id` (editCustomer)
  - Sil: `DELETE /customer-companies/:id` (any(companyAdmin, editCustomer))
- Equipment
  - `GET /equipment`, `/equipment/:id`, `/equipment/types` (viewEquipment)
  - `POST /equipment` (createEquipment)
  - `PUT /equipment/:id`, `PUT /equipment/:id/template` (editEquipment)
  - `DELETE /equipment/:id` (any(companyAdmin, editEquipment))
- Offers
  - CRUD: `GET/POST/PUT/DELETE /offers` (viewOffers/createOffer/editOffer/…)
  - Aksiyonlar: `POST /offers/:id/approve` (approveOffer), `POST /offers/:id/send` (sendOffer),
    `POST /offers/:id/convert-to-work-order` (createWorkOrder)
  - Public takip: `GET /offers/track/:token`
- Work Orders
  - CRUD: `GET/POST/PUT/DELETE /work-orders` (viewWorkOrders/createWorkOrder/editWorkOrder/…)
  - Atama: `PUT /work-orders/:id/assign` (assignWorkOrder)
  - Durum: `PUT /work-orders/:id/status` (updateWorkOrderStatus)
- Inspections
  - Liste/Detay: `GET /inspections`, `/inspections/:id` (viewInspections)
  - Oluştur: `POST /inspections` (createWorkOrder)
  - Güncelle: `PUT /inspections/:id` (editInspection)
  - Kaydet: `POST /inspections/:id/save` (saveInspection)
  - Tamamla: `POST /inspections/:id/complete` (completeInspection)
  - Onay: `POST /inspections/:id/approve` (companyAdmin)
  - Foto: `POST /inspections/:id/photos` (uploadPhotos)
  - Uygunluk: `GET /inspections/check-availability` (viewInspections)
- Reports
  - `GET /reports/:id` (viewReports)
  - `POST /reports/:id/prepare`, `POST /reports/:id/prepare-async`, `GET /reports/jobs/:jobId` (viewReports)
  - `GET /reports/:id/signing-data`, `POST /reports/:id/sign` (signReports)
  - `GET /reports/:id/download?signed=false|true` (downloadReports)
  - `GET /reports/public/:qrToken` (public)

### 7.6. Uploads ve Medya
- Muayene foto gösterimi: `GET /uploads/inspections/:inspectionId/:filename` (public servis, UI’da link gösterimini kısıtlayın).
- Logo: `GET /uploads/logos/:filename` (public).
- Güvenlik: Public URL’ler için UI tarafında yalnızca erişimi beklenen öğeleri listeleyin; asıl güvenlik backend’de.

### 7.7. Yeniden Kullanılabilir Bileşenler
- DataTable (sıralama, filtre, sayfalama)
- Form bileşenleri (Input, Select, DateTime, Number)
- DynamicInspectionForm (equipment.template → sections/fields)
- PhotoUploader (multi, progress, preview)
- PdfViewer (blob/embed, indirme fallback)
- ConfirmDialog, Toast/Notifications
- PermissionGuard, ProtectedRoute
- SearchBar, PaginationControls
- StatusBadge (offer/workOrder/inspection/report durumları)

### 7.8. RTK Query API Katmanı
- `baseApi`: `fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL, prepareHeaders })`
- Tag’ler: `Companies`, `Customers`, `Equipment`, `Technicians`, `Offers`, `WorkOrders`, `Inspections`, `Reports`
- API slice’ları:
  - `authApi`: login, profile
  - `companiesApi`: list/get/create/update/delete, profile
  - `customersApi`: CRUD
  - `equipmentApi`: list/get/types, create/update/template/delete
  - `techniciansApi`: CRUD, permissions, password
  - `offersApi`: CRUD, approve, send, convert, track
  - `workOrdersApi`: CRUD, assign, status
  - `inspectionsApi`: list/get/create/update/save/complete/approve, check-availability, photos
  - `reportsApi`: get, prepare, prepare-async, jobStatus, signing-data, sign, download (download’u normal fetch ile dosya indirme)

### 7.9. Durum ve Hata Yönetimi
- 401: token temizle, `/login`’a yönlendir, toast.
- 403: sayfa içi “izin yok” mesajı ve alternatifler.
- 409/422: form alanı altı hata + toast; uygunluk için alternatif saat öner.
- Optimistic update: yalnızca güvenli PATCH/POST’larda; aksi halde bekle ve doğrula.

### 7.10. Sayfa Bazlı Minimum İçerik
- Dashboard: açık teklifler, yaklaşan iş emirleri, bekleyen imza/raporlar.
- Offers List/Detail: approve/send/convert aksiyonları, durum rozetleri.
- Work Orders List/Detail: atama paneli, durum değişimi, ilişkili muayeneler.
- Inspections Detail/Edit: DynamicInspectionForm, PhotoUploader, Save/Complete, uygunluk kontrolü.
- Reports Detail: Prepare/Prepare-Async (progress/polling), SigningData → local signer (signer.md), Sign, Download, Public link.

### 7.11. Önceliklendirilmiş Sprint Planı
1.  **Faz 1: Temel Kurulum ve Kimlik Doğrulama**
    - Proje iskeletini oluşturma (Vite).
    - Kütüphaneleri kurma (MUI, Redux, Router).
    - Klasör yapısını oluşturma.
    - Tema ve temel layout component'lerini (Sidebar, Header) oluşturma.
    - Login sayfası ve auth akışını tamamlama.
    - Protected Route (yetkisiz erişimi engelleyen) yapısını kurma.

2.  **Faz 2: Ana CRUD Modülleri**
    - Teknisyen yönetimi sayfası.
    - Müşteri firma yönetimi sayfası.
    - Ekipman listeleme sayfası.
    - Genel `DataTable` component'ini oluşturma (sıralama, filtreleme, sayfalama).

3.  **Faz 3: İş Akışı Modülleri**
    - Teklif oluşturma ve listeleme.
    - İş emri oluşturma ve listeleme.
    - Tekliften iş emri oluşturma akışı.
    - Detay sayfaları (OfferDetail, WorkOrderDetail).

4.  **Faz 4: Muayene ve Raporlama**
    - Dinamik muayene formu (`DynamicInspectionForm`) component'ini geliştirme.
    - Muayene verilerini kaydetme ve güncelleme.
    - Rapor görüntüleme sayfası (PDF viewer entegrasyonu).
    - E-imza akışının entegrasyonu.

5.  **Faz 5: Tamamlama ve İyileştirme**
    - Dashboard sayfalarını rol bazlı oluşturma.
    - Mobil uyumluluk testleri ve iyileştirmeleri.
    - Performans optimizasyonları (code splitting, memoization).
    - Kapsamlı testler.
