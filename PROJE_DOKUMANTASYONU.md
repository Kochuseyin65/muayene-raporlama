# Muayene ve Raporlama Sistemi - Kapsamlı Proje Dokümantasyonu

Bu doküman, projenin backend ve frontend dahil olmak üzere tüm yapısını, işlevlerini, teknolojilerini ve iş akışlarını detaylı bir şekilde açıklamaktadır.

## 1. Projeye Genel Bakış

### 1.1. Projenin Amacı ve İşlevi

Bu proje, mühendislik firmalarının sahada gerçekleştirdiği muayene ve test süreçlerini dijitalleştiren, teklif hazırlamadan raporun e-imza ile onaylanmasına kadar tüm yaşam döngüsünü yöneten **çoklu firma (multi-tenant)** destekli bir web uygulamasıdır. Sistemin temel amacı, kağıt, e-posta ve birbirinden kopuk yazılımlar üzerinden yürüyen karmaşık süreçleri tek bir merkezi platformda toplayarak verimliliği artırmak, hata payını düşürmek ve süreçleri standartlaştırmaktır.

### 1.2. Temel İş Akışı

Sistemdeki ana iş akışı aşağıdaki adımlardan oluşur:

1.  **Teklif Oluşturma:** Müşteriden gelen talep üzerine, muayene edilecek ekipmanlar için bir iş teklifi oluşturulur.
2.  **Onay ve İş Emrine Dönüşüm:** Teklif onaylandıktan sonra tek bir tuşla, içindeki ekipmanlara bağlı muayeneleri de otomatik olarak oluşturan bir **İş Emri**'ne dönüştürülür.
3.  **Teknisyen Atama:** İş emrine ilgili teknisyenler atanır.
4.  **Muayene:** Teknisyen, dinamik şablonlar üzerinden saha verilerini (ölçümler, fotoğraflar, sonuçlar) girer.
5.  **Raporlama:** Muayene tamamlandığında, girilen verilerden otomatik olarak standart bir PDF raporu oluşturulur.
6.  **E-İmza:** Oluşturulan rapor, teknisyenin yasal geçerliliği olan e-imzası ile client-side (istemci tarafında) güvenli bir şekilde imzalanır.
7.  **Teslimat:** İmzalı nihai rapor müşteriye e-posta ile gönderilir ve sistemde arşivlenir.

### 1.3. Anahtar Özellikler

-   **Multi-tenant Mimari:** Her muayene firması, kendi kullanıcıları, müşterileri, verileri ve ayarları ile tamamen izole bir alanda çalışır.
-   **Dinamik Muayene Şablonları:** Her ekipman türü için (vinç, basınçlı kap vb.) JSON formatında, tamamen özelleştirilebilir muayene form şablonları oluşturulabilir.
-   **İzin (Permission) Bazlı Yetkilendirme:** Rol bazlı (Role-Based) sistemlerin aksine, her kullanıcıya (`companyAdmin`, `createOffer`, `viewReports` gibi) tek tek yetkiler atanarak çok daha esnek ve granüler bir güvenlik yapısı sunar.
-   **Asenkron PDF Üretimi:** Raporların PDF'e dönüştürülmesi, bir iş kuyruğu (job queue) sistemi ile arka planda asenkron olarak çalışarak kullanıcı deneyimini kesintiye uğratmaz.
-   **Güvenli Dosya Yönetimi:** Yüklenen tüm dosyalar (logolar, muayene fotoğrafları) diskte saklanır ve veritabanında sadece dosya yolları tutularak güvenlik ve performans optimize edilir.
-   **Client-Side E-İmza:** E-imza işlemi, güvenlik standartları gereği kullanıcının bilgisayarında çalışan yerel bir uygulama ile entegre çalışır. Hassas imza verileri asla sunucuya iletilmez.
-   **QR Kod ile Rapor Doğrulama:** Her rapor için üretilen benzersiz QR kod, raporun hızlıca doğrulanmasını ve yetkisiz erişime kapalı bir şekilde görüntülenmesini sağlar.

---

## 2. Teknik Mimari ve Teknoloji Yığını

### 2.1. Backend (`Node.js`)

Projenin backend'i, Express.js framework'ü üzerine inşa edilmiş, modüler ve servis odaklı bir yapıya sahiptir.

-   **Runtime:** Node.js
-   **Framework:** Express.js 4.x
-   **Veritabanı:** PostgreSQL
-   **Veritabanı İstemcisi:** `pg` (Connection Pooling ile)
-   **Kimlik Doğrulama:** `jsonwebtoken` (JWT) ile token-based authentication.
-   **Güvenlik:**
    -   `helmet`: HTTP başlıklarını güvenli hale getirir.
    -   `cors`: Cross-origin istekleri yönetir.
    -   `express-rate-limit`: Brute-force ve DoS saldırılarına karşı istek sınırlaması yapar.
    -   `bcryptjs`: Şifreleri güvenli bir şekilde hash'ler.
-   **Veri Doğrulama:** `express-validator` ile gelen tüm istek verileri (body, params) valide edilir.
-   **Dosya Yönetimi:** `multer` ile dosya yükleme işlemleri yönetilir.
-   **PDF Üretimi:** `puppeteer` kütüphanesi, HTML'den yüksek kaliteli PDF'ler oluşturmak için kullanılır.
-   **Loglama:** `morgan` ile HTTP istekleri loglanır.
-   **Ortam Değişkenleri:** `dotenv` ile konfigürasyon yönetimi yapılır.
-   **Geliştirme:** `nodemon` ile geliştirme ortamında otomatik sunucu yeniden başlatma sağlanır.

### 2.2. Frontend (Planlanan)

Frontend, `FRONTEND_DEVELOPMENT_PLAN.md` ve `frontend.md` dosyalarında detaylandırıldığı üzere, React.js tabanlı modern bir Single Page Application (SPA) olarak planlanmıştır.

-   **Framework:** React.js 18+
-   **State Yönetimi:** Redux Toolkit (RTK) ve RTK Query (API state yönetimi ve caching için).
-   **UI Kütüphanesi:** Material-UI (MUI) veya Tailwind CSS gibi modern bir kütüphane.
-   **Routing:** React Router v6.
-   **Form Yönetimi:** React Hook Form.
-   **API İstemcisi:** Axios.

### 2.3. Veritabanı Mimarisi

-   **Veritabanı Sistemi:** PostgreSQL.
-   **Yaklaşım:** Performans ve esneklik için ORM (Object-Relational Mapping) yerine **Raw SQL** (doğrudan SQL sorguları) tercih edilmiştir.
-   **Dinamik Veri:** Ekipman şablonları (`template`) ve muayene verileri (`inspection_data`) gibi esnek ve dinamik yapılar için PostgreSQL'in `JSONB` veri tipi etkin bir şekilde kullanılır.
-   **Veri Bütünlüğü:** `FOREIGN KEY` kısıtlamaları, `TRANSACTION` blokları (`BEGIN`, `COMMIT`, `ROLLBACK`) ve `TRIGGER`'lar ile veri bütünlüğü en üst düzeyde sağlanır.

---

## 3. Veritabanı Modelleri ve Şeması

Veritabanı şeması, `config/migrations/001_create_tables.sql` dosyasında tanımlanmıştır.

-   **`companies`**: Sisteme kayıtlı muayene firmalarını (tenant) tutar.
-   **`technicians`**: Firmalara bağlı çalışan teknisyenleri ve yöneticileri tutar. `permissions` (JSONB) alanı, kullanıcının yetkilerini bir dizi olarak saklar.
-   **`customer_companies`**: Muayene firmalarının kendi müşteri portföyünü tutar.
-   **`equipment`**: Muayene edilebilir ekipmanları ve bunlara ait dinamik muayene şablonlarını (`template` JSONB alanı) tutar.
-   **`offers`**: Müşterilere sunulan iş tekliflerini, kalemlerini (`items` JSONB alanı) ve durumunu (`status`) yönetir.
-   **`work_orders`**: Onaylanan tekliflerden veya doğrudan oluşturulan iş emirlerini ve durumlarını tutar.
-   **`work_order_assignments`**: Hangi iş emrine hangi teknisyenin atandığını belirten ilişki tablosudur.
-   **`inspections`**: Bir iş emrine bağlı her bir ekipman için oluşturulan muayene kayıtlarını tutar. `inspection_data` (JSONB) alanı, ekipman şablonuna göre doldurulan saha verilerini içerir.
-   **`reports`**: Tamamlanan muayenelerden üretilen raporları yönetir. `unsigned_pdf_path` ve `signed_pdf_path` alanları, oluşturulan PDF dosyalarının diskteki yollarını tutar.
-   **`report_jobs`**: PDF raporlarının asenkron olarak oluşturulması için kullanılan iş kuyruğu tablosudur.

---

## 4. Proje Dosya Yapısı ve Analizi

Proje, sorumlulukların net bir şekilde ayrıldığı modüler bir klasör yapısına sahiptir.

```
backend/
├── config/                 # Veritabanı bağlantısı ve migration'lar
│   ├── database.js         # PostgreSQL connection pool yapılandırması
│   └── migrations/         # Veritabanı şeması ve başlangıç verileri (SQL)
├── controllers/            # İş mantığının bulunduğu yer (Business Logic)
├── middleware/             # Kimlik doğrulama, yetkilendirme, dosya yükleme gibi ara katmanlar
├── routes/                 # API endpoint'lerinin tanımlandığı dosyalar
├── utils/                  # Yardımcı fonksiyonlar ve script'ler (PDF üretimi, migration script'i)
├── uploads/                # Yüklenen dosyaların saklandığı klasör (çalışma zamanında oluşur)
├── app.js                  # Ana Express uygulama dosyası, projenin giriş noktası
├── package.json            # Proje bağımlılıkları ve script'leri
└── .env                    # Ortam değişkenleri (veritabanı bilgileri, JWT anahtarı vb.)
```

### 4.1. Ana Bileşenlerin Görevleri

-   **`app.js`**: Express sunucusunu kurar, tüm middleware'leri (CORS, Helmet, Morgan, Rate Limit) sırasıyla yükler, `routes` klasöründeki endpoint'leri uygulamaya bağlar ve merkezi hata yönetimini (error handling) yapar.
-   **`config/`**: `database.js` ile veritabanı bağlantı havuzunu (pool) yönetir. `migrations/` klasöründeki SQL dosyaları ile veritabanı şemasını oluşturur ve başlangıç verilerini yükler.
-   **`routes/`**: Her bir kaynak (offers, reports, technicians vb.) için bir dosya içerir. Bu dosyalar, gelen HTTP isteklerini (`GET`, `POST`, `PUT`) alır, gerekli middleware'leri (örn: `authMiddleware`, `requirePermission`) çalıştırır ve isteği ilgili `controller` fonksiyonuna yönlendirir.
-   **`middleware/`**:
    -   `auth.js`: Her korumalı istekten önce çalışarak gelen JWT'yi doğrular ve `req.user` nesnesini oluşturur.
    -   `permissions.js`: `requirePermission('yetki_adi')` gibi fonksiyonlarla, kullanıcının o endpoint'e erişim yetkisi olup olmadığını kontrol eder.
    -   `upload.js`: `multer`'ı yapılandırarak dosya yükleme işlemlerini (boyut, tip, kayıt yeri) yönetir.
-   **`controllers/`**: Uygulamanın beynidir. İş mantığı burada yer alır. Bir `controller` fonksiyonu, `route`'tan gelen isteği alır, `express-validator` ile veriyi doğrular, `pool.query` ile veritabanı işlemlerini yapar (genellikle bir transaction içinde), ve sonucu istemciye standart bir JSON formatında döner.
-   **`utils/`**:
    -   `migrate.js`: `npm run migrate` komutuyla veritabanı migration'larını çalıştıran script.
    -   `pdfGenerator.js`: `puppeteer` kullanarak HTML'den PDF üretir.
    -   `reportRenderer.js`: Rapor verilerini alıp dinamik olarak raporun HTML içeriğini oluşturur.
    -   `reportWorker.js`: `report_jobs` tablosundaki işleri periyodik olarak alıp işleyen asenkron PDF oluşturma işçisidir.
    -   `storage.js`: Rapor PDF'lerinin disk üzerinde nereye ve nasıl kaydedileceğini yöneten yardımcı fonksiyonları içerir.

---

## 5. API Endpoint'leri ve Kullanımı

API, `api-documentation.md` ve `API_GUIDE.md` dosyalarında detaylıca belgelenmiştir. Tüm endpoint'ler `/api` ön eki ile başlar ve JWT ile korunmaktadır.

**Örnek Endpoint Analizi: İş Emri Oluşturma**

-   **Endpoint:** `POST /api/work-orders`
-   **Açıklama:** Yeni bir iş emri oluşturur. İsteğe bağlı olarak teknisyen ataması ve muayene kaydı da yapar.
-   **Yetki:** `createWorkOrder` izni gerektirir.
-   **Middleware Zinciri:** `authMiddleware` -> `requirePermission('createWorkOrder')` -> `createWorkOrderValidation` -> `createWorkOrder` (controller).
-   **Request Body:**
    ```json
    {
      "customerCompanyId": 1,
      "assignedTechnicians": [3, 4],
      "scheduledDate": "2025-10-15",
      "equipmentIds": [1, 2],
      "notes": "Acil muayene talebi."
    }
    ```
-   **İşleyiş:**
    1.  `authMiddleware` ve `requirePermission` yetki kontrolü yapar.
    2.  `createWorkOrderValidation` middleware'i, body'deki alanların (ID'lerin integer olması, tarihin geçerli formatta olması vb.) doğruluğunu kontrol eder.
    3.  `workOrderController.createWorkOrder` fonksiyonu çalışır.
    4.  Bir veritabanı transaction'ı (`BEGIN`) başlatır.
    5.  `work_orders` tablosuna yeni bir kayıt ekler.
    6.  `assignedTechnicians` dizisindeki her teknisyen için `work_order_assignments` tablosuna kayıt ekler.
    7.  `equipmentIds` dizisindeki her ekipman için `inspections` tablosuna varsayılan değerlerle bir muayene kaydı oluşturur.
    8.  Tüm işlemler başarılı ise transaction'ı onaylar (`COMMIT`), değilse geri alır (`ROLLBACK`).
    9.  Oluşturulan iş emri verisini `201 Created` status kodu ile döner.

*(Diğer tüm endpoint'ler benzer şekilde `routes`, `controllers` ve dokümantasyon dosyaları incelenerek analiz edilebilir.)*

---

## 6. E-İmza ve Raporlama Akışı

Bu sistemin en kritik özelliklerinden biri güvenli e-imza sürecidir.

1.  **PDF Hazırlama:** Bir muayene tamamlandığında veya teknisyen "Kaydet" butonuna bastığında, backend `reportRenderer.js` ve `pdfGenerator.js` kullanarak raporun imzasız bir PDF versiyonunu oluşturur ve `uploads/reports/{report_id}/unsigned.pdf` yoluna kaydeder.
2.  **İmzalama Verisi Alma:** Frontend, imzalama işlemi için `GET /api/reports/:id/signing-data` endpoint'ini çağırır. Bu endpoint, hazırlanan imzasız PDF'i Base64 formatında istemciye gönderir.
3.  **Client-Side İmzalama:** Frontend, bu Base64 verisini ve kullanıcının PIN kodunu, teknisyenin bilgisayarında `http://localhost:61812/api/Sign/Sign` adresini dinleyen yerel **e-signer** uygulamasına bir POST isteği ile gönderir.
4.  **İmzalı Veriyi Alma:** Yerel e-signer uygulaması, işlemi gerçekleştirir ve imzalanmış PDF'i yine Base64 formatında frontend'e geri döner.
5.  **İmzalı Raporu Yükleme:** Frontend, aldığı bu imzalanmış Base64 verisini `POST /api/reports/:id/sign` endpoint'ine gönderir.
6.  **Kaydetme:** Backend, teknisyenin PIN kodunu veritabanındaki ile karşılaştırır, doğrulama başarılı ise imzalı PDF'i `uploads/reports/{report_id}/signed.pdf` olarak kaydeder ve veritabanındaki ilgili rapor kaydını "imzalandı" olarak günceller.

Bu akış, kullanıcının e-imza anahtarının ve PIN'inin asla bilgisayar dışına çıkmamasını sağlayarak yüksek güvenlik sunar.

---

## 7. Testler

Proje, `scripts/test_backend.py` adında bir Python script'i ile uçtan uca (end-to-end) test edilmektedir. Bu script:
-   Admin olarak giriş yapar.
-   Yeni bir müşteri ve ekipman oluşturur.
-   Tam bir teklif -> iş emri -> muayene -> rapor akışını simüle eder.
-   Dosya yükleme, PDF oluşturma ve imzalama adımlarını test eder.
-   Tüm adımların başarılı olup olmadığını kontrol ederek bir özet raporu (`a.txt`) oluşturur.

Bu test, projenin ana iş akışlarının her zaman doğru çalıştığını garanti altına almak için kritik bir rol oynar.
