# Sorun Giderme (Troubleshooting)

## 1. Görseller / Fotoğraflar Sayfada Görünmüyor
- Belirti: `<img>` içinde doğru src olmasına rağmen görüntü yok.
- Neden: CORP (Cross-Origin Resource Policy) engeli olabilir.
- Çözüm: `backend/app.js` helmet ayarını `crossOriginResourcePolicy: { policy: 'cross-origin' }` olarak kullanın.

## 2. Fotoğraflar Formda Görünmüyor
- Belirti: Photos sayfasında var, formdaki photos section’da yok.
- Neden: Template `type: 'photos'` alan adı (field) farklı; değerler `inspection_data[field]` altında.
- Çözüm: Photos sayfasına `?field=<alan>` ile giderek doğru alana upload yapın; form renderer typed photos’u gösterir.

## 3. Kaydet/Tamamla’da “Geçerli bir saat formatı kullanınız”
- Neden: Backend `HH:MM` bekler; `HH:MM:SS` girilmiş olabilir.
- Çözüm: UI saat alanı `HH:MM`’e normalize eder; yine de yanlışsa alan altı hata verir.

## 4. 403 Yetki Hatası
- Neden: Kullanıcıda ilgili permission yok.
- Çözüm: Technicians → izin düzenle; gerekli izinleri ekleyin (editInspection, saveInspection vb.).

## 5. Migrasyon Hataları ("relation exists")
- Neden: Tüm SQL dosyalarını baştan çalıştırma.
- Çözüm: Seçimli çalıştırın: `npm run migrate -- 007` veya `MIGRATE_ONLY=007 npm run migrate`.

## 6. Rapor Prepare-Async Durmuyor
- Kontrol: `GET /reports/jobs/:jobId` yanıtı `completed/failed` dönüyor mu?
- Dev: Worker çalışıyor mu (`node utils/reportWorker.js`)?

## 7. PDF Üretimi Başarısız
- Puppeteer bağımlılıkları eksik olabilir; sistem paketlerini yükleyin; gerekirse `PUPPETEER_NO_SANDBOX=true`.
