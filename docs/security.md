# Güvenlik

## 1. Kimlik ve Yetki
- JWT (Bearer) + Permission tabanlı kontrol. Route-level `requirePermission` ve UI-level guard.
- superAdmin bypass (UI ve backend).

## 2. Veri Güvenliği
- PDF/foto dosya sistemi; DB yalnızca yol saklar. Path traversal koruması.
- Public uçlar sınırlı: Teklif tracking, Rapor public (imza zorunlu).

## 3. Rate Limit ve Helmet
- express-rate-limit: auth/upload/genel için limitçiler (dev’de kapalı, prod’da açın).
- helmet: CORP `cross-origin` (dev’de front/ api farklı origin olduğunda img yükleme için).

## 4. Upload Güvenliği
- Multer fileFilter (mime) + size limitleri.
- Serve tarafında Content-Type doğru setlenir.

## 5. Uygulama Seviyesi Validasyonlar
- express‑validator ile create/update uçları; `VALIDATION_ERROR` üretir.
- Zaman formatı (HH:MM), Required alanlar (complete öncesi kontrol).

## 6. Multi-tenant İzolasyon
- Tüm sorgularda `company_id` bağlamı kontrolü (auth middleware req.user.company_id ile).

## 7. Genel Öneriler
- Üretimde HTTPS zorunlu.
- JWT anahtarının rotasyonu.
- Dosya temizliği (yetim dosyalar), log sanitizasyonu, PII maskeleme.
