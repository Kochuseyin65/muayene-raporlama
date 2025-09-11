Genel Bakış

  - Amaç: Teklif → İş Emri → Muayene → Rapor → E‑İmza akışını yöneten bir B2B muayene/raporlama sistemi.
  - Backend: REST API + JWT kimlik doğrulama, PDF üretimi (Puppeteer), dosya tabanlı PDF depolama.
  - Frontend: Yetkili kullanıcıların CRUD işlemleri ve akış adımlarını yönetmesi; rapor hazırlama ve imzalama süreçlerinin görselleştirilmesi.

  Çekirdek Kavramlar

  - Teklif (Offer): Müşteriye sunulan iş kapsamı ve fiyat. Onayla/Gönder/İş Emrine Dönüştür.
  - İş Emri (Work Order): Planlanmış ve atanmış saha işi; zaman dilimi ve teknisyen eşleşmesi.
  - Muayene (Inspection): Sahadaki veri/medya toplanması ve statü yönetimi.
  - Rapor (Report): Muayene verilerinden PDF üretimi; unsigned ve signed PDF yolları.
  - Firma/Müşteri/Donanım (Company/Customer Companies/Equipment): Bağlı kaynaklar ve referanslar.
  - Teknisyen (Technician): İş emri ataması ve muayene icrası.

  Kimlik Doğrulama ve Yetkilendirme

  - Login ile JWT alınır; tüm korumalı isteklerde Authorization: Bearer <token>.
  - 401: token yok/geçersiz; 403: erişim yok (rol/şirket kısıtı).
  - Frontend: Token’ı bellek veya güvenli storage’da tutup isteklerde header ekleyin; 401 durumunda oturum sonlandırma.

  Ortam Değişkenleri (Backend)

  - REPORTS_PATH: PDF depolama klasörü (örn. backend/uploads/reports).
  - JWT_SECRET: JWT imzalama anahtarı.
  - DB_*: Veritabanı ayarları.
  - PUPPETEER_*: PDF üretim davranışı.
  - Frontend .env: VITE_API_BASE_URL (örn. http://localhost:3000/api).

  PDF Depolama

  - Artık base64 kolonları yok; sadece dosya sistemi kullanılır.
  - Yollar: backend/uploads/reports/<report_id>/unsigned.pdf ve .../signed.pdf (ya da REPORTS_PATH/<report_id>/...).
  - Frontend: İndir/Görüntüle butonları doğrudan indirme endpoint’ine gider; imza sonrası signed PDF’i gösterin.

  API Yüzeyi (Özet)

  - Auth: POST /api/auth/login, GET /api/auth/me
  - Şirketler: GET/POST/PUT/DELETE /api/companies
  - Müşteri Şirketleri: GET/POST/PUT/DELETE /api/customer-companies
  - Donanım: GET/POST/PUT/DELETE /api/equipment
  - Teknisyenler: GET/POST/PUT/DELETE /api/technicians
  - Teklifler:
      - CRUD: GET/POST/PUT/DELETE /api/offers
      - Aksiyonlar: POST /api/offers/:id/approve, POST /api/offers/:id/send, POST /api/offers/:id/convert (İş Emri)
  - İş Emirleri:
      - CRUD: GET/POST/PUT/DELETE /api/work-orders
      - Atama/Zaman: POST /api/work-orders/:id/assign, POST /api/work-orders/:id/schedule
  - Muayeneler:
      - CRUD: GET/POST/PUT/DELETE /api/inspections
      - Aksiyonlar: POST /api/inspections/:id/complete, POST /api/inspections/:id/approve
      - Foto Yükleme: POST /api/inspections/:id/photos (multipart/form-data)
      - Uygunluk: GET /api/inspections/availability?date=...&technicianId=...
  - Raporlar:
      - Durum/Getir: GET /api/reports, GET /api/reports/:id
      - Hazırla (senkron): POST /api/reports/:id/prepare
      - Hazırla (asenkron): POST /api/reports/:id/prepare-async, GET /api/reports/jobs/:jobId
      - İmza için veri: GET /api/reports/:id/signing-data
      - İmzala: POST /api/reports/:id/sign
      - İndir: GET /api/reports/:id/download?type=unsigned|signed
      - (Varsa) Public paylaşım: GET /api/reports/:id/public

  Not: Endpoint path’leri projede birebir bu şekildedir; bazı aksiyon adları controller bazlı farklılık gösterebilir. Frontend bu sözleşmeye göre entegre olmalı; yeni sürümlerde OpenAPI dosyası eklenmesi önerilir.

  Veri Modelleri ve Alanlar (Tipik)

  - Ortak: id, created_at, updated_at, company_id.
  - Teklif: title, customer_company_id, items[], total, status (draft/sent/approved), notes.
  - İş Emri: offer_id, scheduled_date, time_slot, technician_id, status (planned/assigned/completed), location.
  - Muayene: work_order_id, form_data (JSON), photos[], status (in_progress/completed/approved).
  - Rapor: inspection_id, unsigned_pdf_path, signed_pdf_path, status (preparing/ready/signed), metadata.
  - Teknisyen: name, email, phone, skills[], active.
  - Donanım: serial_no, type, model, customer_company_id, meta.
  - Frontend: Statü stringlerini sabit kabul etmeyin; sözlükle gösterim yapın.

  Hata ve Validasyon

  - HTTP kodlarına güvenin: 400 (validasyon), 401, 403, 404, 409 (çakışma), 422 (iş kuralı).
  - JSON gövdesinde genelde message veya error bilgisi döner.
  - Frontend: Form alanı bazlı validasyonlar için backend mesajlarını alanlara eşleyin; ortak toast + alan altı hata deseni kullanın.

  Listeleme ve Sorgulama

  - Tipik parametreler: ?page=1&limit=20&sort=created_at&order=desc&query=...
  - Bazı listelerde henüz sayfalama olmayabilir; frontend seçenekli pagination komponenti kullanıp response yapısına göre davranmalı.

  Dosya Yükleme ve Medya

  - Foto yükleme: POST /api/inspections/:id/photos ile multipart/form-data, alan adı genelde file veya files[].
  - Boyut/tip kısıtları backend’de kontrol edilir; imkân varsa client’ta ön validasyon yapın.
  - Gösterim: Upload endpoint’inden dönen URL veya id ile GET çağrısı.

  E2E Akışlar ve UI Senaryoları

  - Teklif → İş Emri → Muayene → Rapor → E‑İmza
      1. Teklif oluştur: Başlık, müşteri, kalemler → POST /offers
      2. Gönder/Onayla: POST /offers/:id/send, sonra .../approve
      3. İş Emrine dönüştür: POST /offers/:id/convert → work_order_id
      4. Planla & Ata: POST /work-orders/:id/schedule (tarih/zaman) + .../assign (teknisyen)
      5. Muayene icrası: Mobil/saha ekranından form_data + foto yükleme; POST /inspections/:id/complete
      6. Muayeneyi onayla: POST /inspections/:id/approve
      7. Rapor hazırla: POST /reports/:id/prepare-async → jobId; GET /reports/jobs/:jobId ile bekle
      8. PDF hazır: GET /reports/:id/download?type=unsigned
      9. E‑İmza: GET /reports/:id/signing-data, ardından POST /reports/:id/sign → signed_pdf_path
     10. İmzalı rapor indir: GET /reports/:id/download?type=signed
     10. İmzalı rapor indir: GET /reports/:id/download?type=signed
  -
  Zaman Dilimi Çakışmaları: work-orders planlarken benzersiz time_slot kuralı bulunur. Frontend’de bulanık arama ile uygun saat önerisi isteyin; çakışmada kullanıcıya alternatif sunun.

  Örnek İstek/Gövdeler

  - Login:
      - POST /api/auth/login body: {"email":"user@acme.com","password":"secret"}
      - Response: {"token":"<JWT>","user":{"id":1,"name":"...","company_id":...}}
  - Teklif Oluştur:
      - POST /api/offers body:
      `{"title":"Bakım","customer_company_id":5,"items":[{"desc":"Muayene","qty":1,"price":1000}],"notes":""}`
  - İş Emrine Dönüştür:
      - POST /api/offers/:id/convert → {"work_order_id":123,"status":"converted"}
  - Muayene Foto Yükle:
      - POST /api/inspections/:id/photos form-data: files[] çoklu dosya
      - Response: {"uploaded":[{"id":10,"url":"/uploads/..."}]}
  - Rapor Hazırla (async):
      - POST /api/reports/:id/prepare-async → {"jobId":"abc123"}
      - GET /api/reports/jobs/abc123 → {"status":"done","report_id":77}

  Frontend Mimarisi (Öneri)

  - Stack: React + Vite + TypeScript; State: Redux Toolkit + RTK Query; Router: React Router.
  - API katmanı: RTK Query baseQuery ile VITE_API_BASE_URL; prepareHeaders içinde JWT ekleyin.
  - Modüller:
      - auth: login/logout, me fetch, 401 yakalama ve yönlendirme.
      - companies, customers, equipment, technicians: CRUD listeler + formlar.
      - offers: liste, detay, onay/gönder/dönüştür işlemleri; teklif kalemleri formu.
      - work-orders: takvim/tabloda planlama; teknisyen atama UI; çakışma uyarıları.
      - inspections: saha formu (dinamik JSON form alanları), foto yükleme, tamamlama/onay.
      - reports: hazırlama (async job polling), ilerleme göstergesi, PDF önizleme/indir, imza akışı.
  - UI Akışları:
      - Dashboard: açık teklifler, yaklaşan iş emirleri, bekleyen raporlar.
      - Bildirim/Toast: işlem başarı/hatada standart bileşen.
      - Yetki: 403 gelen aksiyonları UI’dan gizleyin ama backend’e güvenin.
  - Bileşenler:
      - DataTable (sıralama/filtreleme/paging), Form (Yup/Zod validasyon), Uploader, PdfViewer.
  - Hata Yönetimi:
      - RTK Query onQueryStarted ile optimistic update; 409/422 durumunda rollback.
      - Global error boundary ve yeniden deneme stratejileri (idempotent GET’lerde otomatik retry).
  - Tarih/Zaman:
      - Backend ISO 8601 döner; UI’da kullanıcı saat dilimine dönüştürün; filtreler UTC gönderilebilir.

  Durum Makineleri ve Statü Yönetimi

  - Teklif: draft → sent → approved → converted
  - İş Emri: planned → assigned → completed
  - Muayene: in_progress → completed → approved
  - Rapor: idle/preparing → ready → signed
  - UI’da butonları statüye göre etkinleştirin; backend 409/422 ile kuralları uygular.

  Güvenlik İpuçları (Frontend Perspektifi)

  - Token sızıntısını önlemek için mümkünse memory storage; sayfa yenilemede me ile rehydrate.
  - Dosya önizlemede MIME/Tür kontrolü; kullanıcıya sadece yetkili linkleri gösterin.
  - Form input sanitizasyonu; ancak asıl validasyon backend’dedir.

  Yerel Geliştirme

  - Backend’i .env ile çalıştırın; frontend .env içinde VITE_API_BASE_URL ayarlayın.
  - Seed/Test kullanıcıları: Login için backend sağladığı test hesabını kullanın (ör. admin@demo.com / admin123 benzeri; repo dokümantasyonuna bakın).
  - PDF üretimi için Puppeteer sistem bağımlılıkları gerekebilir; Linux’ta başlıca kütüphaneler yüklü olmalı.

  Test ve Kalite

  - E2E: Temel “happy path” senaryoları kapsıyor; negatif testler az. Frontend’de kritik akışlara Cypress/Playwright testleri ekleyin.
  - Tip güvenliği: API yanıt tiplerini zod ile doğrulayıp TypeScript tipleri üretin.
  - Loglama: Hata bağlamını Sentry vb. ile toplayın (istek id, kullanıcı id).

  Sık Karşılaşılan Durumlar

  - Zaman Dilimi Çakışması: Planlama sırasında 409 alırsanız uygun slot arama endpoint’i/algoritmasıyla yeni saat önerin.
  - PDF Hazırlama Gecikmesi: Async job status polling; makul timeout ve kullanıcıya ilerleme metni.
  - 401/403: Oturum düşmüş olabilir; token yenileme yoksa tekrar login.

  Endpoint Kullanım Şablonları (RTK Query örnekleri)

  - Base:
      - fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_BASE_URL, prepareHeaders: (h,{getState}) => { const t=selectToken(getState()); if(t) h.set('Authorization', 'Bearer '+t); return h; }})
  - Login:
      - mutation: builder.mutation<LoginResp, LoginReq>({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) })
  - Rapor Prepare Async:
      - mutation: builder.mutation<JobStartResp, {id:number}>({ query: ({id}) => ({ url: \/reports/${id}/prepare-async`, method:'POST' }) })`
      - Sonrasında useLazyGetJobStatusQuery(jobId) ile polling.

  Ekran/Modül Listesi (MVP)

  - Auth: Login, Profil
  - Teklifler: Liste, Oluştur/Düzenle, Detay, Gönder/Onay/Dönüştür
  - İş Emirleri: Takvim/Gantt, Atama, Planlama
  - Muayeneler: Saha formu, Foto yükleme, Tamamlama/Onay
  - Raporlar: Hazırlama, İlerleme, Önizleme, İmza, İndir
  - Varlık Yönetimi: Şirketler, Müşteri Şirketleri, Donanım, Teknisyenler
  - Ayarlar: Şirket ayarları, Kullanıcı tercihleri

  Performans ve UX

  - Liste sayfalarında server‑side filtre/sıralama; debounce’lu arama.
  - Büyük listelerde sanal listeleme; görüntü önbelleği (foto/thumbnail).
  - Ağ kesintilerinde dayanaklılık: istek yeniden deneme, optimistic UI sadece güvenilir PATCH/POST’larda.

  Bakım ve Yol Haritası (Frontend Tarafı)

  - OpenAPI 3.1 şeması geldiğinde client’ı yeniden üretme.
  - Kurumsal temalar ve i18n (TR/EN).
  - Erişilebilirlik (WCAG) ve test kapsamını artırma.
  - CI: PR’da lint/test/build; örnek seed ile preview deploy.

  İstersen, bu dokümana eşlik eden:

  - API tipleri için TypeScript arayüzleri,
  - RTK Query slice’ları (auth/offers/workOrders/inspections/reports),
  - Sayfa kabukları (route’lar) ve temel bileşenleri
  içeren bir başlangıç scaffold’ı da çıkarabilirim.