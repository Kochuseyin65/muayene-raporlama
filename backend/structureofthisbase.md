
# Muayene ve Raporlama Sistemi - Proje Yapısı ve Kod Analizi

Bu doküman, "Muayene ve Raporlama Sistemi" backend projesinin tüm yapısını, kullanılan teknolojileri, dosya ve klasörlerin görevlerini ve kod analizini detaylı bir şekilde açıklamaktadır.

## 1. Projeye Genel Bakış

Bu proje, mühendislik firmalarının muayene ve raporlama süreçlerini dijitalleştirmeyi amaçlayan bir Node.js tabanlı backend uygulamasıdır. Sistem, çoklu firma (multi-tenant) mimarisini desteklemekte ve her firmanın kendi müşterilerini, teknisyenlerini, ekipmanlarını ve raporlarını yönetmesine olanak tanımaktadır.

**Temel İş Akışı:**
Teklif Oluşturma -> İş Emrine Dönüştürme -> Muayene -> Raporlama ve E-imza

**Ana Özellikler:**
- **RESTful API:** Frontend uygulamaları için standart bir arayüz sağlar.
- **Multi-tenant Mimari:** Her muayene firması kendi verilerini izole bir şekilde yönetir.
- **Dinamik Şablonlar:** Her ekipman türü için özelleştirilebilir muayene formları (şablonlar) oluşturulabilir.
- **Yetkilendirme:** Rol tabanlı değil, izin (permission) tabanlı esnek bir yetkilendirme sistemi mevcuttur.
- **PDF Rapor Üretimi:** Muayene verilerinden otomatik olarak PDF formatında raporlar oluşturulur.
- **E-imza Entegrasyonu:** Raporların yasal geçerliliği için e-imza altyapısı sunar.
- **Dosya Yönetimi:** Firma logoları ve muayene fotoğrafları gibi dosyaların güvenli bir şekilde yüklenmesini ve sunulmasını sağlar.

---

## 2. Teknoloji Stack'i ve Bağımlılıklar

Projenin kalbi olan `package.json` dosyası, kullanılan teknolojiler ve bağımlılıklar hakkında bilgi verir.

### `package.json`

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "migrate": "node utils/migrate.js",
    "test": "echo "Error: no test specified" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.1",
    "express": "^4.19.2",
    "express-rate-limit": "^8.0.1",
    "express-validator": "^7.2.1",
    "helmet": "^8.1.0",
    "html-pdf": "^3.0.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.1",
    "multer": "^2.0.2",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  }
}
```

**Analiz:**
- **`express`**: Projenin temelini oluşturan web framework'ü. API yönlendirmeleri (routing), middleware yönetimi ve HTTP istek/cevap döngüsünü yönetir.
- **`pg`**: PostgreSQL veritabanı ile iletişimi sağlayan Node.js istemcisi.
- **`jsonwebtoken` (JWT)**: Kullanıcıların kimliğini doğrulamak ve API güvenliğini sağlamak için token tabanlı bir yetkilendirme mekanizması sunar.
- **`bcryptjs`**: Kullanıcı şifrelerini veritabanında güvenli bir şekilde saklamak için hash'leme işlemi yapar.
- **`express-validator`**: Gelen API isteklerindeki verilerin (body, params, query) doğruluğunu ve formatını kontrol eder.
- **`multer`**: Dosya yükleme (upload) işlemlerini (örn: resimler, logolar) yöneten bir middleware'dir.
- **`html-pdf`**: HTML içeriğini PDF formatına dönüştürerek dinamik raporlar oluşturmayı sağlar.
- **`helmet`**: HTTP başlıklarını (headers) düzenleyerek uygulamayı bilinen web zafiyetlerine karşı korur.
- **`cors`**: Cross-Origin Resource Sharing politikalarını yöneterek, frontend uygulamasının farklı bir domain'den API'ye güvenli bir şekilde erişmesini sağlar.
- **`express-rate-limit`**: API'ye gelen istek sayısını sınırlayarak brute-force ve DoS saldırılarına karşı koruma sağlar.
- **`morgan`**: Gelen HTTP isteklerini log'layarak geliştirme ve hata ayıklama süreçlerine yardımcı olur.
- **`dotenv`**: Ortam değişkenlerini (`.env` dosyası) yöneterek, konfigürasyonun koddan ayrılmasını sağlar.
- **`nodemon`**: Geliştirme ortamında, kodda yapılan değişiklikleri otomatik olarak algılayıp sunucuyu yeniden başlatır.

---

## 3. Ana Uygulama Dosyası (`app.js`)

Projenin giriş noktasıdır. Express uygulamasını yapılandırır, middleware'leri entegre eder, route'ları (yönlendirmeleri) bağlar ve sunucuyu başlatır.

### `app.js`

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla giriş denemesi' } }
});

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla dosya yükleme denemesi' } }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Çok fazla istek' } }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authLimiter);
app.use('/api/uploads', uploadLimiter);
app.use('/api', generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const technicianRoutes = require('./routes/technicians');
const customerCompanyRoutes = require('./routes/customerCompanies');
const equipmentRoutes = require('./routes/equipment');
const offerRoutes = require('./routes/offers');
const workOrderRoutes = require('./routes/workOrders');
const inspectionRoutes = require('./routes/inspections');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/customer-companies', customerCompanyRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Bir hata oluştu'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint bulunamadı'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

**Analiz:**
- **Middleware Entegrasyonu:** `helmet`, `cors`, `morgan` gibi güvenlik ve loglama middleware'leri tüm uygulamaya entegre edilir.
- **Rate Limiting:** API'nin farklı bölümleri (`/api/auth`, `/api/uploads`, genel) için ayrı ayrı istek limitleri tanımlanmıştır. Bu, sisteme yönelik kötü niyetli saldırıları önler.
- **Body Parsers:** `express.json()` ve `express.urlencoded()` middleware'leri, gelen isteklerin (request) body'sindeki JSON ve URL-encoded verileri parse ederek `req.body` nesnesine ekler. `limit: '10mb'` ayarı, büyük PDF'ler veya veriler için istek boyutunu artırır.
- **Route Yönetimi:** Projenin modüler yapısını destekleyecek şekilde, her bir ana kaynak (auth, companies, technicians vb.) için ayrı route dosyaları (`./routes` klasöründen) yüklenir ve ilgili API yollarına (`/api/auth`, `/api/companies` vb.) bağlanır.
- **Health Check Endpoint'i:** `/api/health` yolu, sunucunun çalışıp çalışmadığını kontrol etmek için basit bir endpoint sağlar. Bu, özellikle container'laşmış ortamlarda (Docker, Kubernetes) önemlidir.
- **Hata Yönetimi (Error Handling):** Uygulama genelinde oluşabilecek hataları yakalayan merkezi bir error handler bulunur. Bu middleware, beklenmedik hatalarda sunucunun çökmesini engeller ve istemciye standart bir hata formatında yanıt döner.
- **404 Handler:** Tanımlı olmayan herhangi bir yola (endpoint) istek yapıldığında, "Endpoint bulunamadı" mesajıyla standart bir 404 hatası döndürür.
- **Sunucu Başlatma:** `.env` dosyasından veya varsayılan olarak 3000 portundan sunucuyu dinlemeye başlar.

---

## 4. Konfigürasyon (`config/`)

Bu klasör, uygulamanın temel yapılandırma ayarlarını içerir.

### `config/database.js`

Veritabanı bağlantısını yönetir.

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

module.exports = pool;
```

**Analiz:**
- **Connection Pooling:** `pg.Pool` kullanarak bir bağlantı havuzu oluşturur. Bu, her veritabanı sorgusu için yeni bir bağlantı açmak yerine, mevcut bağlantıları yeniden kullanarak performansı artırır.
- **Yapılandırma:** Bağlantı ayarları (`host`, `port`, `database` vb.) `.env` dosyasından alınır. Bu, farklı ortamlar (geliştirme, test, production) için farklı veritabanı ayarlarının kolayca yönetilmesini sağlar.
- **Havuz Ayarları:** `max: 20` ile aynı anda en fazla 20 veritabanı bağlantısına izin verilir. `idleTimeoutMillis` ve `connectionTimeoutMillis` ayarları, bağlantıların zaman aşımlarını yönetir.
- **Event Listeners:** `connect` ve `error` olayları dinlenerek, bağlantı durumu ve olası hatalar konsola yazdırılır.

### `config/migrations/`

Veritabanı şemasının oluşturulması ve başlangıç verilerinin yüklenmesi için gerekli SQL dosyalarını içerir.

#### `001_create_tables.sql`

Tüm veritabanı tablolarını, ilişkilerini (foreign keys), index'leri ve trigger'ları oluşturur.

**Analiz:**
- **Tablolar:** `companies`, `technicians`, `customer_companies`, `equipment`, `offers`, `work_orders`, `inspections`, `reports` gibi sistemin temel veri yapılarını tanımlar.
- **İlişkiler:** `REFERENCES` anahtar kelimesi ile tablolar arası ilişkiler (örn: bir teknisyenin bir firmaya ait olması) kurulur. `ON DELETE CASCADE` ile ana kayıt silindiğinde bağımlı kayıtların da silinmesi sağlanır.
- **JSONB Veri Tipi:** `template` (ekipman şablonları) ve `inspection_data` (muayene verileri) gibi dinamik ve esnek veri yapıları için PostgreSQL'in `JSONB` tipi kullanılır. Bu, NoSQL benzeri bir esneklik sağlar.
- **Performans:** Sık sorgulanan alanlar için `CREATE INDEX` komutu ile index'ler oluşturularak veritabanı sorgu performansı artırılır.
- **Triggers:** `update_updated_at_column` fonksiyonu ve trigger'ları, bir kayıt güncellendiğinde `updated_at` alanının otomatik olarak güncellenmesini sağlar.

#### `002_seed_data.sql`

Geliştirme ortamını hızlıca ayağa kaldırmak için örnek veriler ekler.

**Analiz:**
- **Örnek Firma ve Kullanıcılar:** Test amaçlı bir muayene firması (`ABC Mühendislik`), bir süper admin, bir firma admini ve bir teknisyen oluşturur. Şifreler `bcrypt` ile hash'lenmiş olarak eklenir.
- **Örnek Müşteri ve Ekipman:** Test senaryolarını kolaylaştırmak için bir müşteri firma ve farklı şablonlara sahip iki adet örnek ekipman (`Kule Vinç`, `Basınçlı Hava Tankı`) ekler.
- **Yetkiler:** Oluşturulan kullanıcılara, rollerine uygun izinler (permissions) atanır.

---

## 5. Middleware'ler (`middleware/`)

Express'in istek/cevap döngüsü arasında çalışan ara katman fonksiyonlarıdır.

### `middleware/auth.js`

Gelen isteklerdeki JWT'yi doğrulayarak kullanıcı kimliğini belirler.

```javascript
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // ...
    }
    
    const token = authHeader.substring(7);
    
    // ...
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT t.*, c.name as company_name FROM technicians t JOIN companies c ON t.company_id = c.id WHERE t.id = $1 AND t.is_active = true',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      // ...
    }
    
    req.user = result.rows[0];
    next();
    
  } catch (error) {
    // ...
  }
};

module.exports = authMiddleware;
```

**Analiz:**
- **Token Kontrolü:** `Authorization` başlığından `Bearer` token'ı alır.
- **Token Doğrulama:** `jwt.verify` ile token'ın geçerliliğini ve imzasını kontrol eder. Süresi dolmuş veya geçersiz token'lar için hata döndürür.
- **Kullanıcı Bilgisi Ekleme:** Token içerisindeki kullanıcı ID'si ile veritabanından kullanıcı bilgilerini çeker ve bu bilgileri `req.user` nesnesine ekler. Bu sayede sonraki controller ve middleware'ler, istek yapan kullanıcının kim olduğunu ve yetkilerini bilebilir.

### `middleware/permissions.js`

Kullanıcının belirli bir işlemi yapma yetkisi olup olmadığını kontrol eder.

```javascript
const PERMISSIONS = {
  // ... (tüm izinlerin listesi)
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    // ...
    const userPermissions = req.user.permissions || [];
    
    if (userPermissions.includes('superAdmin')) {
      return next();
    }
    
    if (!userPermissions.includes(permission)) {
      // ... (hata döndür)
    }
    
    next();
  };
};

// ... (requireAnyPermission fonksiyonu)
```

**Analiz:**
- **İzin Listesi:** `PERMISSIONS` nesnesi, sistemdeki tüm olası izinleri ve açıklamalarını barındırır.
- **`requirePermission`:** Belirli bir tek iznin gerekli olduğu durumlar için bir middleware fabrikasıdır. Örneğin, `requirePermission('createOffer')` middleware'i, kullanıcının teklif oluşturma yetkisi olup olmadığını kontrol eder.
- **`requireAnyPermission`:** Verilen izin listesinden herhangi birine sahip olmanın yeterli olduğu durumlar için kullanılır.
- **Super Admin Ayrıcalığı:** `superAdmin` yetkisine sahip kullanıcılar, diğer tüm yetki kontrollerini otomatik olarak geçer.

### `middleware/upload.js`

Dosya yükleme işlemlerini `multer` kütüphanesi ile yapılandırır.

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ... (ensureUploadDir fonksiyonu)

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ...
  },
  filename: (req, file, cb) => {
    // ...
  }
});

// ... (inspectionPhotoStorage, imageFileFilter, uploadLogo, uploadInspectionPhotos, handleUploadError)
```

**Analiz:**
- **Depolama Stratejisi:** `multer.diskStorage` ile yüklenen dosyaların nereye ve hangi isimle kaydedileceği belirlenir. Firma logoları ve muayene fotoğrafları için ayrı klasör yapıları ve isimlendirme mantıkları kullanılır.
- **Dosya Filtreleme:** `imageFileFilter` fonksiyonu, sadece belirtilen MIME türlerindeki (jpeg, png vb.) resim dosyalarının yüklenmesine izin verir.
- **Limitler:** Yüklenebilecek maksimum dosya boyutu ve dosya sayısı gibi limitler belirlenir.
- **Hata Yönetimi:** `handleUploadError` middleware'i, dosya yükleme sırasında oluşabilecek `multer` kaynaklı hataları (dosya çok büyük, çok fazla dosya vb.) yakalayarak standart bir hata formatında yanıt döndürür.

---

## 6. Yönlendirmeler (Routes) (`routes/`)

API endpoint'lerini tanımlar ve bu endpoint'lere gelen istekleri ilgili controller fonksiyonlarına yönlendirir. Her kaynak (resource) için ayrı bir dosya oluşturulmuştur.

### Örnek: `routes/workOrders.js`

```javascript
const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const authMiddleware = require('../middleware/auth');
const { requirePermission, requireAnyPermission } = require('../middleware/permissions');

// GET /api/work-orders - Get all work orders
router.get('/', 
  authMiddleware, 
  requirePermission('viewWorkOrders'), 
  workOrderController.getWorkOrders
);

// POST /api/work-orders - Create new work order
router.post('/', 
  authMiddleware, 
  requirePermission('createWorkOrder'),
  workOrderController.createWorkOrderValidation,
  workOrderController.createWorkOrder
);

// ... (diğer work order endpoint'leri)

module.exports = router;
```

**Analiz:**
- **Modülerlik:** Her kaynak kendi route dosyasında yönetilir, bu da projenin okunabilirliğini ve bakımını kolaylaştırır.
- **Middleware Zinciri:** Her bir endpoint için bir middleware zinciri tanımlanır. Örneğin, bir iş emri oluşturmak için (`POST /api/work-orders`):
  1. `authMiddleware` çalışır, kullanıcı kimliğini doğrular.
  2. `requirePermission('createWorkOrder')` çalışır, kullanıcının yetkisini kontrol eder.
  3. `workOrderController.createWorkOrderValidation` çalışır, gelen veriyi valide eder.
  4. Son olarak `workOrderController.createWorkOrder` fonksiyonu çalışarak iş mantığını yürütür.
- **RESTful Tasarım:** HTTP metodları (GET, POST, PUT, DELETE) ve URL yapıları, RESTful API prensiplerine uygun olarak tasarlanmıştır.

---

## 7. Controller'lar (`controllers/`)

Uygulamanın iş mantığını (business logic) içeren dosyalardır. Gelen istekleri işler, veritabanı operasyonlarını gerçekleştirir ve istemciye yanıt döndürürler.

### Örnek: `controllers/workOrderController.js`

```javascript
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

// ... (generateWorkOrderNumber fonksiyonu)

const getWorkOrders = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { page = 1, limit = 20, status, assignedTo, search, customerCompanyId } = req.query;
    
    // ... (veritabanı sorgusu oluşturma)
    
    const result = await pool.query(query, params);
    
    // ... (sayfalama için toplam sayıyı alma)
    
    res.json({
      success: true,
      data: {
        workOrders: result.rows,
        pagination: {
          // ...
        }
      }
    });
    
  } catch (error) {
    // ... (hata yönetimi)
  }
};

const createWorkOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // ... (veritabanına birden fazla ekleme işlemi)
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: workOrder
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ... (diğer work order fonksiyonları ve validation kuralları)

module.exports = {
  // ...
};
```

**Analiz:**
- **İş Mantığı:** Her fonksiyon, belirli bir API endpoint'inin işlevini yerine getirir (örn: iş emirlerini listeleme, yeni iş emri oluşturma).
- **Veritabanı Etkileşimi:** `pool.query` kullanılarak veritabanı sorguları çalıştırılır. Sorgular, SQL injection saldırılarını önlemek için parametreli olarak yazılmıştır.
- **Veri Doğrulama (Validation):** Her controller dosyasının sonunda, ilgili endpoint'ler için `express-validator` kuralları tanımlanır. Bu kurallar, gelen verinin beklenen formatta ve içerikte olmasını sağlar.
- **Veri İzolasyonu:** Tüm sorgularda `WHERE company_id = $1` koşulu kullanılarak, kullanıcıların sadece kendi firmalarına ait verileri görmesi ve yönetmesi sağlanır (multi-tenant).
- **Transaction Yönetimi:** `createWorkOrder` gibi birden fazla veritabanı işleminin yapıldığı fonksiyonlarda, işlemler bir transaction bloğu (`BEGIN`, `COMMIT`, `ROLLBACK`) içine alınır. Bu, işlemlerden herhangi biri başarısız olursa tüm değişikliklerin geri alınmasını sağlayarak veri bütünlüğünü korur.
- **Yanıt Formatı:** Tüm başarılı yanıtlar `{ success: true, data: { ... } }` formatında, hatalar ise `{ success: false, error: { ... } }` formatında standart bir yapıda döndürülür.

---

## 8. Yardımcı Fonksiyonlar (`utils/`)

Projenin genelinde kullanılabilecek yardımcı araçları ve script'leri içerir.

### `utils/migrate.js`

Veritabanı migration'larını komut satırından çalıştırmak için bir script'tir.

```javascript
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    // ...
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      // ...
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sqlContent);
      // ...
    }
    // ...
  } catch (error) {
    // ...
  }
}

// ... (testConnection ve script'i çalıştırma bloğu)
```

**Analiz:**
- **Otomasyon:** `npm run migrate` komutu ile çalıştırıldığında, `config/migrations` klasöründeki tüm `.sql` dosyalarını sıralı bir şekilde veritabanında çalıştırır.
- **Sıralama:** Dosyaları alfabetik olarak sıralayarak, migration'ların doğru sırada (örn: `001_...` sonra `002_...`) çalışmasını garanti eder.
- **Bağlantı Testi:** Migration'ları çalıştırmadan önce veritabanı bağlantısını test eder.

---

## 9. Dokümantasyon Dosyaları

- **`.gitignore`**: `node_modules`, `.env` dosyaları, log'lar ve yüklenen dosyalar gibi versiyon kontrolüne dahil edilmemesi gereken dosyaları ve klasörleri listeler.
- **`API_GUIDE.md`**: API'nin tüm endpoint'lerini, beklenen istek (request) ve yanıt (response) formatlarını, yetkilendirme gereksinimlerini ve örnek kullanımları detaylı bir şekilde açıklar. Bu, frontend geliştiricileri veya API'yi kullanacak diğer servisler için temel başvuru kaynağıdır.
- **`API_USAGE_GUIDE.md`**: `API_GUIDE.md`'nin daha basitleştirilmiş ve hızlı başlangıç odaklı bir versiyonudur. `curl` komutları gibi pratik örnekler içerir.
- **`PROJECT_STRUCTURE.md`**: Projenin genel yapısını, mimarisini ve her bir bileşenin görevini açıklar. Bu dosya, projeye yeni katılan geliştiricilerin sistemi hızla anlamasına yardımcı olur.
- **`README.md`**: Projenin ne olduğu, hangi teknolojileri kullandığı, nasıl kurulup çalıştırılacağı hakkında temel bilgileri içerir. Genellikle projeye ilk bakılan dosyadır.

Bu yapı, projenin modüler, sürdürülebilir, güvenli ve ölçeklenebilir olmasını sağlamak üzere tasarlanmıştır.
