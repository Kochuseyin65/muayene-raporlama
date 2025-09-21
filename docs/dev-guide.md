# Geliştirici Başlangıç Rehberi

## 1. Önkoşullar
- Node.js 18+, npm 8+
- PostgreSQL 13+
- (Linux) Puppeteer sistem bağımlılıkları

## 2. Kurulum
```bash
# Backend
cd backend
npm ci
cp .env.example .env  # yoksa mevcut .env'i düzenleyin
npm run migrate       # yeni kurulum
npm run dev

# Frontend
cd ../frontend
npm ci
npm run dev
```

## 3. Ortam Değişkenleri
- Backend `.env`: PORT, DB_*, JWT_SECRET, REPORTS_PATH, PUPPETEER_*, REPORT_PUBLIC_BASE_URL (public rapor linki için taban URL)
- Frontend `.env`: `VITE_API_BASE_URL=http://localhost:3000/api`

## 4. Test ve Doğrulama
- Sağlık: `GET /api/health`
- Login: `POST /api/auth/login` (seed kullanıcılar)
- E2E: `scripts/test_backend.py` (çalışan API ister)

## 5. Geliştirme İpuçları
- RTK Query’nin cache invalidation’ını `providesTags/invalidatesTags` ile yönetin.
- Hata mesajlarında backend `error.message`’ı aynen iletin (kullanıcıya net sebep).
- Saat alanlarında `HH:MM` formatına normalize edin.
- superAdmin bypass ve PermissionRoute profil-hydrate bekleme özelliğini bozmayın.
- Teknisyen rolleri için standart izin setini oluştururken `viewMyWorkOrders` ve `viewMyInspections` değerlerini ekleyin; bu sayede “Benim İş Emirlerim / Muayenelerim” menüleri aktif olur.

## 6. Tipik İş Akışları (Geliştirici)
- Örnek ekipman ve template: `python scripts/create_example_equipment.py`
- Teklif → İş Emri → Muayene → Rapor → İmza happy path’i elle doğrulayın.

## 7. Yaygın Komutlar
```bash
# Seçimli migrasyon
MIGRATE_ONLY=007 npm run migrate
npm run migrate -- 007

# Worker (rapor prepare-async için)
node utils/reportWorker.js
```

## 8. Kod Tarzı
- Backend: Express controller/middleware ayrımı; utils ile ortaklaşa
- Frontend: Feature-first klasörleme; PageHeader + DataTable + RTK Query desenleri
- Dosyalarda TR/EN karışımı varsa (UI TR, kod EN) tutarlı kalın

## 9. Sorun Giderme
- Görseller görünmüyor: Helmet CORP ayarı `cross-origin` olmalı; `<img src="/api/uploads/...">`
- Saat formatı hatası: `HH:MM:SS` gelirse `HH:MM`’e kes; regex doğrula
- 403: İzin eksik; Technician → Permissions’tan ver
```
