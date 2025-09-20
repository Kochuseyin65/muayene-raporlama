# Rapor Şablonu: HTML → PDF Dönüşüm Rehberi

Bu belge, uygulamada rapor şablonlarının HTML’e dönüştürülmesi ve sonrasında PDF üretilmesi sürecinin nasıl çalıştığını açıklar. Kod isimleri İngilizce, açıklamalar Türkçedir.

## Amaç
- Muayene verilerinin (inspection_data), ekipman şablonunun (template) ve fotoğrafların derlenerek kurumsal görünümlü bir HTML rapora; ardından aynı içeriğin PDF’e dönüştürülmesine hizmet eder.
- PDF dosyaları dosya sisteminde saklanır, veritabanında yalnızca dosya yolu tutulur.

## Ana Bileşenler
- `backend/utils/reportRenderer.js`
  - Şablon + muayene verilerini HTML’e dönüştürür.
  - Modern (typed) ve legacy şablonları destekler.
  - XSS’e karşı tüm alanları escape eder; tablo, rozet, fotoğraf ızgarası gibi temel stilleri uygular.
  - Rapor alt bilgisinde QR kodu çizer: `report.qr_code_data_url` doluysa görsel olarak QR’ı basar, yanında public doğrulama URL’sini gösterir; yoksa eski token metnine döner.

- `backend/utils/pdfGenerator.js`
  - Puppeteer ile HTML’den PDF üretir.
  - `generatePDFBufferFromHTML(html)`: Buffer döndürür (tercih edilen yol).
  - `generatePDFFromHTML(html)`: Base64 döndürür (e‑imza akışında gerekir).

- `qrcode` kütüphanesi
  - `REPORT_PUBLIC_BASE_URL` ortam değişkeni ile oluşturulan public rapor URL’sini QR koduna dönüştürür (`attachReportQrCode`).
  - Worker ve eşzamanlı download akışlarında rapor nesnesine `qr_code_data_url` ve `qr_public_url` alanları eklenir.

- `backend/utils/storage.js`
  - Yollar: `REPORTS_PATH/<report_id>/unsigned.pdf` ve `.../signed.pdf`.
  - `writeFileAtomic(path, buffer)`: Geçici dosya üzerinden atomik yazım yapar.
  - `fileExists`, `readFileBase64` yardımcıları.

- `backend/controllers/reportController.js`
  - İndirme (`downloadReport`) ve hazırlama (`prepareReportPdf`) uçlarını yönetir.
  - Eksikse imzasız PDF’i canlı üretir; indirme öncesi PDF geçerliliğini kontrol eder.

- (Opsiyonel) `backend/utils/reportWorker.js`
  - Asenkron hazırlama kuyruğu için arka plan işçisi; HTML→PDF üretip dosyayı yazar.

## HTML Oluşturma
- Giriş: `buildHTML(report)`
  - Kaynak veri: `report.template` (şablon), `report.inspection_data` (muayene verisi), `report.photo_urls` (fotoğraflar), firma/müşteri/iş emri/tarih/teknisyen gibi meta bilgiler.
  - Typed şablon türleri: `key_value`, `checklist`, `table`, `photos`, `notes`.
  - Legacy destek: `sections[].fields` yapısı algılanırsa `renderLegacy` işletilir.
  - Çıktı: Tam HTML dokümanı (`<!DOCTYPE html> ...`) — base CSS dâhil.
  - QR blok: alt bilgi bölümünde veri URI olarak gelen QR görselini (veya fallback token metnini) çizip doğrulama linkini sunar.

## PDF Üretimi (Puppeteer)
- `generatePDFBufferFromHTML(html)`
  - Chromium’u headless açar (`PUPPETEER_*` env’lerine uyar), `page.setContent(html)` ve `page.pdf({ format: 'A4', printBackground: true, margin: ... })` çalıştırır.
  - Binary PDF içeriğini Buffer olarak döndürür (lossless).

- `generatePDFFromHTML(html)`
  - Yukarıdaki Buffer çıktısını base64’e çevirir (e‑imza akışında istemcinin beklediği format).

### Performans: Puppeteer Yeniden Kullanımı
- Tek bir Puppeteer browser instance’ı oluşturulup (singleton) sonraki çağrılarda tekrar kullanılır.
- Her PDF üretimi için yalnızca yeni bir `page` açılır ve iş bitince kapatılır.
- Kazanım: Daha az process/ram tüketimi ve daha hızlı PDF üretimi.

## Senkron Hazırlama Akışı
- Uç: `POST /api/reports/:id/prepare`
  1) Controller rapor + ilişkili verileri yükler.
  2) `buildHTML(report)` ile HTML üretilir.
  3) `generatePDFBufferFromHTML` ile PDF Buffer elde edilir.
  4) `writeFileAtomic(unsignedPdfPath(id), buf)` ile dosya yazılır; DB’de `unsigned_pdf_path` güncellenir.

## Asenkron Hazırlama Akışı
- Uçlar: `POST /api/reports/:id/prepare-async` ve `GET /api/reports/jobs/:jobId`
  1) İş, `report_jobs` tablosuna `pending` olarak eklenir.
  2) `reportWorker.js` boşta kaldıkça iş çeker, `buildHTML` + `generatePDFBufferFromHTML` + `writeFileAtomic` işlemlerini yapar.
  3) Başarılı olursa `report_jobs.status = completed`, rapor yolu güncellenir.

## İndirme (Download) Akışı ve Güvenli Başlıklar
- Uç: `GET /api/reports/:id/download?signed=true|false`
  - İstenen (signed/unsigned) dosya yoksa; unsigned için canlı üretim devreye girer.
  - İndirme öncesi PDF doğrulaması yapılır (aşağıda ayrıntı).
  - Başlıklar:
    - `Content-Type: application/pdf`
    - `Content-Disposition`: RFC 5987 uyumlu; güvenli ASCII `filename` ve UTF‑8 için `filename*` birlikte gönderilir.
      - Örn: `attachment; filename="Rapor_123.pdf"; filename*=UTF-8''Rapor%20(İmzalı).pdf`
      - ASCII dışı karakterler için güvenli yedek: `[^A-Za-z0-9._-] → _`, CR/LF engeli, iç tırnakların ayıklanması.

## PDF Doğrulama ve Onarım
- Amaç: Yanlışlıkla base64 içeriği dosyaya yazılmış ya da bozuk dosyaların indirme sırasında kullanıcıya gitmesini engellemek.
- Adımlar (controller içinde):
  1) Dosyanın ilk 5 baytı okunur; `%PDF-` beklenir. Uygunsa direkt gönderilir.
  2) Değilse ve dosya içerik olarak base64’e benziyorsa, decode edilip tekrar yazılır (başlangıcı `%PDF-` ise kabul edilir). Bu adım yalnızca dosya boyutu `PDF_BASE64_REPAIR_MAX_BYTES` (varsayılan 30MB) altında ise denenir; aksi hâlde RAM maliyetinden kaçınmak için atlanır.
  3) Hâlâ geçersizse ve belge imzasız ise: HTML’den yeniden PDF üretilir ve dosya üzerine yazılır.
  4) İmzalı dosyada onarım başarısız olursa `INVALID_PDF` döner (manuel müdahale gerekebilir).

## E‑İmza Akışı (Özet)
- `GET /api/reports/:id/signing-data` → `{ pdfBase64 }` (unsigned.pdf’den okunur; eksikse üretilebilir).
- İstemci local signer ile base64’ü imzalar ve `POST /api/reports/:id/sign` ile `signedPdfBase64` gönderir.
- Backend imzalı dosyayı Buffer’a çevirip `signed.pdf` olarak saklar; DB’de `is_signed` ve `signed_pdf_path` güncellenir.

## Ortam Değişkenleri
- `REPORTS_PATH`: Rapor dosyalarının kök dizini (varsayılan: `backend/uploads/reports`).
- `PUPPETEER_NO_SANDBOX`, `PUPPETEER_HEADLESS`, `PUPPETEER_EXECUTABLE_PATH`: Puppeteer davranışını kontrol eder.
- `REPORT_PUBLIC_BASE_URL`: Public rapor doğrulama sayfasının tam adresi (örn. `https://app.example.com/reports/public`). QR kodlar bu URL + `/:qrToken` formatını kullanır.

## Sık Karşılaşılan Sorunlar ve Çözümler
- “Invalid character in header content [Content-Disposition]”
  - Sebep: Dosya adında Türkçe/özel karakter veya CR/LF. Çözüm: Güvenli `Content-Disposition` (ASCII fallback + `filename*`).
- İndirilen PDF sembollerle açılıyor (bozuk/gibberish)
  - Sebep: Base64 içeriğin doğrudan dosyaya yazılması veya bozuk dosya.
  - Çözüm: Buffer bazlı yazım; indirme öncesi `%PDF-` doğrulaması; base64→binary onarımı; gerekirse unsigned için yeniden üretim.
- Başlıklar kayboluyor veya PDF inline açılıyor
  - `Content-Disposition`’ı `attachment` olarak gönderdiğinizden ve özel karakterlerin uygun kodlandığından emin olun.

## Test ve Doğrulama İpuçları
- Dosya başını doğrulayın: `xxd -l 8 -g 1 <path>` → `%PDF-` beklenir (`25 50 44 46 2d ...`).
- Tarayıcı Network sekmesinde indirme yanıt başlıklarını kontrol edin.
- E‑imza akışı için base64 round‑trip: `GET signing-data` → signer → `POST sign` → `download?signed=true`.
