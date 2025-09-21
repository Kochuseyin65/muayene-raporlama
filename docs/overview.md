# Proje Özeti ve İş Akışları

Bu belge, Muayene ve Raporlama Sistemi’nin ne olduğunu, hedeflerini, kullanıcı tiplerini ve uçtan uca iş akışlarını açıklar. Amaç, yeni bir mühendisin yalnızca bu dokümantasyonla projeyi anlayıp geliştirmeye devam edebilmesidir.

## 1. Amaç ve Kapsam
- Amaç: Mühendislik firmalarının muayene ve raporlama süreçlerini dijitalleştirmek; Teklif → İş Emri → Muayene → Rapor → E‑İmza zincirini yönetmek.
- Kapsam: Çok kiracılı (multi‑tenant) mimari; firma bazlı veri izolasyonu; granüler izin sistemi; PDF rapor üretimi; yerel e‑imza entegrasyonu; fotoğraf yönetimi; public doğrulama (QR).
- Yığın: Node.js (Express), PostgreSQL (JSONB ile), JWT, Multer, Puppeteer, Vite + React (MUI), RTK Query.

## 2. Kullanıcı Profilleri ve İzinler
- Super Admin: Tüm firmaları ve sistem ayarlarını yönetir. (Tüm izinler bypass)
- Company Admin: Kendi firması kapsamında tam yetki (izin matrisine bağlı kısıtlı istisnalar olabilir).
- Technician: Atandığı işlerde muayene yapar, form doldurur, foto yükler; yetkisine göre kaydet/tamamla.
  - “Benim İş Emirlerim” (`viewMyWorkOrders`) ve “Benim Muayenelerim” (`viewMyInspections`) ekranları üzerinden yalnızca kendisine atanmış kayıtları takip eder.
- Müşteri (Public): Teklif takibi ve imzalı rapor public görüntüleme.

İzin matrisinin tamamı için bkz. security.md ve api.md — uç başlıklarında “Permission”.

## 3. İş Akışları

### 3.1 Teklif (Offer)
1) Yetkili kullanıcı yeni teklif oluşturur (müşteri, kalemler, toplam tutar).
2) Onay süreci (internal approve) ve müşteriye gönderim (send) — tracking linki üretilir.
3) Müşteri linkten kabul/ret verebilir (public endpoints).
4) Onaylı/görüntülenmiş teklifler iş emrine dönüştürülebilir.

### 3.2 İş Emri (Work Order)
1) Manuel veya tekliften dönüşümle oluşturulur.
2) Teknisyen atamaları yapılır (çoklu — work_order_assignments).
3) Ekipman seçilirse muayeneler otomatik üretilir.
4) Durum geçişleri: not_started → in_progress → completed → approved → sent (kurallar için bkz. flows.md).

### 3.3 Muayene (Inspection)
1) Her muayenenin benzersiz `inspection_number`’ı vardır (INSP‑…).
2) Ekipmanın `template`’i form bileşenlerine dönüşür (typed + legacy destek). Değerler `inspections.inspection_data` JSONB’ye yazılır.
3) Fotoğraflar dosya sistemine yazılır; `photo_urls` ve/veya `inspection_data[photoField]` altında referanslanır.
4) Kaydet (save): rapor kaydı oluşturulur/güncellenir (qr_token). Tamamla (complete): required alan validasyonu yapılır, otomatik unsigned PDF üretimi denenir.

### 3.4 Rapor (Report)
1) Prepare (senkron) veya Prepare‑Async (job) ile unsigned PDF üretilir (dosya sistemi).
2) İmza verisi (base64) alınır; yerel imzalayıcı (signer) ile imzalanır; backend’e gönderilerek signed.pdf kaydı yapılır.
3) İndir (unsigned/signed). Public doğrulama için `GET /api/reports/public/:qrToken` — yalnızca imzalı rapor görüntülenebilir.

## 4. Mimari Özellikler
- Monolitik Express API: Controller/Middleware/Route ayrımı, utils ile destek.
- PostgreSQL + JSONB: Dinamik form verisini (template/inspection_data) ilişkisel dünyada esnek şekilde saklama.
- Dosya Sistemi: Rapor PDF ve fotoğraflar. DB yalnızca dosya yollarını tutar.
- Ön Yüz: Vite + React 18 + MUI + RTK Query. Permission guard’lı rotalar. Dinamik form renderer.

## 5. Senaryolar (Happy Path)

### Senaryo A: Teklif → İş Emri → Muayene → Rapor → İmza
- Offer oluştur → approve → send → customer accept → convert-to-work-order
- WO atama ve planlama → muayeneler otomatik oluşur
- Inspection form doldur, foto yükle → save → complete → prepare → sign → download
- İmzalı rapor üretildikten sonra PDF alt bilgisindeki QR kodu, public doğrulama sayfasına yönlendirir (`/reports/public/:token`). İmzalı dosya yoksa public indirme otomatik olarak imzasız versiyonu sunar.

### Senaryo B: Direkt İş Emri + Muayene
- WO create (müşteri + ekipmanlar) → assign teknisyen → inspections oluşur
- Inspection işlemleri (A ile benzer)

## 6. Kaynaklar
- API Dokümanı (api.md)
- Veritabanı (database.md)
- Ön Yüz Rehberi (frontend.md)
- Arka Uç Rehberi (backend.md)
- İş Akışları ve Durumlar (flows.md)
