# Muayene ve Raporlama Sistemi

Mühendislik firmalarının muayene ve raporlama süreçlerini dijitalleştiren, çok kiracılı (multi‑tenant) bir backend API.

Bu README günceldir (2025‑09‑05) ve mevcut kod tabanına göre hızlı kurulum, çalışma ve mimari özetini içerir.

## 🎯 Proje Özeti

- Çok kiracılı yapı: Her firma verisi izolasyonlu.
- İnce taneli yetkilendirme: Permission tabanlı erişim.
- Dinamik şablonlar: Ekipman bazlı esnek muayene formları (JSONB).
- PDF rapor: Puppeteer ile HTML→PDF; dosya sistemi üzerinde saklama.
- E‑imza: İmza verisi hazırlama ve imzalı PDF kaydı.
- QR doğrulama: İmzalı raporlar public QR token ile görüntülenebilir.

İş Akışı (özet)
```
Teklif → İş Emri → Muayene → Rapor → E‑İmza (→ Müşteriye Gönderim)
```

## 🛠 Teknoloji Stack

- Node.js 18+, Express 4
- PostgreSQL (raw SQL + migrasyonlar)
- JSON Web Token (JWT), express‑validator, multer
- Puppeteer (PDF üretimi)
- Helmet, CORS, rate‑limit, morgan

## 📂 Depo Yapısı (özet)

```
/
├─ backend/            # Express API
│  ├─ app.js           # Sunucu, rotalar, hata yakalama
│  ├─ config/          # DB ve migrasyonlar
│  ├─ controllers/     # İş kuralları
│  ├─ middleware/      # auth, permissions, upload
│  ├─ routes/          # REST uçları
│  ├─ utils/           # migrate, pdf, renderer, storage, worker
│  └─ uploads/         # Çalışma zamanı dosyalar (raporlar, fotolar)
├─ scripts/            # E2E test scripti
├─ CODEBASE_REPORT.md  # Ayrıntılı mimari rapor
└─ README.md
```

## ⚙️ Ortam Değişkenleri (backend/.env)

```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=muayene_db
DB_USER=muayene_user
DB_PASSWORD=strong_password

JWT_SECRET=change_me_for_prod

# PDF/Chrome
PUPPETEER_NO_SANDBOX=true
PUPPETEER_HEADLESS=true
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable   # (opsiyonel)

# Rapor depolama kökü (yoksa backend/uploads/reports)
REPORTS_PATH=./uploads/reports
```

## 🚀 Hızlı Başlangıç (Yeni Makine)

Önkoşullar
- Node.js 18+, npm 8+
- PostgreSQL 13+
 - Linux için Puppeteer bağımlılıkları (Ubuntu/Debian):
  ```bash
  sudo apt-get update && sudo apt-get install -y \
    libnss3 libatk-bridge2.0-0 libxkbcommon0 libgtk-3-0 \
    libasound2 libgbm1 libpango-1.0-0 libxshmfence1 fonts-liberation
  ```
 - Linux için Puppeteer bağımlılıkları (Arch Linux):
   ```bash
   sudo pacman -Syu --needed \
     nss atk at-spi2-core libxkbcommon gtk3 \
     alsa-lib libgbm pango libxshmfence ttf-liberation
   ```

Adımlar
```bash
# 1) Kodu alın
git clone <repo-url> muayene
cd muayene/backend

# 2) Bağımlılıkları kurun
npm ci   # (yoksa npm install)

# 3) Veritabanını hazırlayın (psql ile)
psql -U postgres -c "CREATE USER muayene_user WITH PASSWORD 'strong_password';"
psql -U postgres -c "CREATE DATABASE muayene_db OWNER muayene_user;"

# 4) .env dosyasını oluşturun (örneği yukarıda)
$EDITOR .env

# 5) Migrasyonları çalıştırın (şema + seed)
npm run migrate   # (node utils/migrate.js)

# 6) Geliştirme sunucusunu başlatın
npm run dev

# 7) Sağlık kontrolü
curl http://localhost:3000/api/health
```

Opsiyonel: Asenkron PDF işçisi
```bash
cd backend
node utils/reportWorker.js
```

## 📦 PDF Depolama

- Dosya sistemi üzerinde saklanır: `<REPORTS_PATH>/<report_id>/unsigned.pdf|signed.pdf`.
- `POST /api/reports/:id/prepare` imzasız PDF üretir; indirme sırasında da otomatik üretim yapılabilir.
- `POST /api/reports/:id/sign` imzalı PDF’i kaydeder ve `signed_pdf_path` alanını günceller.

## 🧪 Uçtan Uca Test (scripts/test_backend.py)

Sunucu çalışırken ayrı terminalde:
```bash
pip install requests
BASE=http://localhost:3000/api EMAIL=admin@abc.com PASS=password \
  python scripts/test_backend.py

# Sonuç raporu: scripts/a.txt (26/26 geçerse her şey yolunda)
```

## 🔑 Test Kullanıcıları (seed)

- Super Admin: `superadmin@abc.com` / `password`
- Company Admin: `admin@abc.com` / `password`
- Technician: `ahmet@abc.com` / `password` (PIN: `123456`)

## 🔗 API ve Mimari Dokümantasyon

- API kılavuzları: `backend/API_USAGE_GUIDE.md`, `backend/API_GUIDE.md`
- Ayrıntılı mimari ve uç noktalar: `CODEBASE_REPORT.md`

## 🛡 Güvenlik Notları (özet)

- Rate limitleri prod’da etkinleştirin (app.js’te hazır, dev’de kapalı).
- `JWT_SECRET` üretimde güçlü ve döndürülebilir olmalı.
- Public upload GET uçlarını imzalı URL/TTL ile korumayı değerlendirin.
- Puppeteer için gerekli sistem paketlerini imaj/hosta ekleyin; gerekirse `--no-sandbox`.

## 🗃 Migrasyonlar ve Geçiş Notu

- Şema (001) base64 PDF sütunlarını artık içermez. Eski DB’lerde kolon temizliği için `006_drop_base64_columns.sql` bulunur.
- Geçiş önerisi:
  1) Eksik dosya yolu kontrolü: `SELECT COUNT(*) FROM reports WHERE unsigned_pdf_path IS NULL OR (is_signed AND signed_pdf_path IS NULL);`
  2) Gerekirse `prepare`/`download` ile imzasız, `sign` ile imzalı üretin.
  3) `psql -U postgres -d <DB> -f backend/config/migrations/006_drop_base64_columns.sql`.

## 📜 Lisans

Bu proje özel kullanım içindir.

---

Hazır URL’ler
- Backend API: http://localhost:3000/api
