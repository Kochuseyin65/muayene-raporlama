# İş Akışları ve Durum Geçişleri

Bu belge, modüller arasındaki ilişkiyi ve durum makinalarını ayrıntılı şekilde açıklar.

## 1. Üst Düzey Akış
```
Teklif (offers) → İş Emri (work_orders) → Muayene (inspections) → Rapor (reports) → E‑İmza
```

## 2. Teklif Durumları
- `pending` → `approved` → `sent` → `viewed` → (`converted` iş emrine dönüşünce işaretlenebilir)
- İş kuralları: approved olmadan convert önerilmez; public accept/decline ile müşteri kararı tutulur.

## 3. İş Emri Durumları
- `not_started` → `in_progress` → `completed` → `approved` → `sent`
- Kurallar:
  - `completed` için: ilişkili tüm muayeneler `completed` olmalı.
  - `approved` sadece `completed`’dan geçer; `sent` yalnızca `approved`’dan.

## 4. Muayene Durumları
- `not_started` → `in_progress` → `completed` → `approved`
- `complete` için required alanlar dolu olmalı (template + inspection_data).

## 5. Rapor Durumları
- `idle/preparing` → `ready (unsigned.pdf)` → `signed (signed.pdf)`
- Asenkron hazırlama: `report_jobs.status` → `pending/processing/completed/failed`

## 6. Fotoğraf Akışı
- Yükleme → Multer (dosya sistemi) → `photo_urls` → (opsiyonel) `inspection_data[fieldName]` push.
- Silme → dosya + `photo_urls` listesi + `inspection_data[fieldName]` temizleme.

## 7. İzinler (Özet)
- Offers: view/create/edit/approve/send/convert
- Work Orders: view/create/edit/assign/updateStatus
- Inspections: view/edit/save/complete/uploadPhotos
- Reports: view/prepare/download/sign/send

## 8. Zaman Slotu Çakışma Kontrolü
- `GET /inspections/check-availability` → teknisyen bazlı aynı gün/saat çakışmaları listeler.

## 9. E‑İmza Akışı
1) `GET /reports/:id/signing-data` → base64
2) Local signer (PIN + base64 → signedBase64)
3) `POST /reports/:id/sign` → signed.pdf dosyası yazılır, DB güncellenir
4) `GET /download?signed=true` → imzalı PDF indir

## 10. Public Akışlar
- Teklif tracking: görüntüleme, kabul/ret
- Rapor public: `/reports/public/:qrToken` metadata + inline önizleme sağlar. PDF indirmede imzalı dosya önceliklidir; yoksa imzasız versiyona otomatik düşer. PDF alt bilgisindeki QR kodu aynı public route'a yönlendirir.
