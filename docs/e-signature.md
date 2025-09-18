# E‑İmza Entegrasyonu

Bu belge, raporların yerel imzalayıcı (signer) ile imzalanması akışını açıklar.

## 1. Kavramlar
- İmza yerelde yapılır: Güvenlik gereği imzalama anahtarı makineden çıkmaz.
- Backend sadece unsigned PDF base64 verir ve imzalanmış base64’ü alıp dosya olarak saklar.

## 2. Uçlar
- `GET /api/reports/:id/signing-data` → `{ pdfBase64 }`
- `POST /api/reports/:id/sign { pin, signedPdfBase64 }` → signed.pdf yazılır

## 3. Yerel İmzalayıcı (signer.md)
- Yerel HTTP API: `http://localhost:61812` (varsayılan)
- Örnek uçlar:
  - `GET /api/Sign/GetUserCertificate`
  - `POST /api/Sign/Sign` — body `{ PIN, CallbackUrl, Base64ContentList }`

## 4. Akış
1) Rapor ekranında (InspectionReportPage) kullanıcı `İmzala` der.
2) Backend’ten `pdfBase64` alınır. Not: Backend indirme akışında ise Buffer bazlı yazım ve PDF doğrulaması kullanılır; imza akışında ise base64 içerik döner.
3) Yerel signer’a PIN ve base64 gönderilir; imzalı base64 alınır.
4) Backend’e `POST /sign` ile imzalı base64 gönderilir; signed.pdf path’i güncellenir.
5) İmza sonrası indirme ve public görüntüleme aktifleşir.

## 5. Güvenlik Notları
- PIN istemci tarafında tutulmaz, sadece local signer’a gönderilir.
- Backend, imzalı PDF’i dosya sistemine yazar; DB’de sadece yol saklanır.
- Public `GET /reports/public/:qrToken` imzalı dosya mevcutsa erişime izin verir.
