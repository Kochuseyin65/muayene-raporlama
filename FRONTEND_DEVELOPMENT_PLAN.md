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
