# Veritabanı — Şema, Modeller ve Migrasyonlar

Bu belge, PostgreSQL şemasını, tablo ve alanları, ilişkileri ve migrasyon stratejisini açıklar.

## 1. Genel İlkeler
- JSONB kullanımı: `equipment.template` (şablon), `inspections.inspection_data` (form değerleri), foto alanları.
- Dosya yolları: PDF ve fotoğraflar dosya sisteminde; yol alanları DB’de.
- Zorunlu alan validasyonunun bir kısmı DB kısıtlarıyla, bir kısmı uygulama katmanında yapılır.

## 2. Tablolar (Özet)
- `companies(id, name, tax_number, address, contact, logo_url, timestamps)`
- `technicians(id, company_id→companies, name, surname, email(unique), phone, password_hash, e_signature_pin, permissions JSONB[], is_active, timestamps)`
- `customer_companies(id, company_id→companies, name, tax_number, address, contact, email, authorized_person, timestamps)`
- `equipment(id, company_id→companies, name, type, template JSONB, is_active, timestamps)`
- `offers(id, company_id→companies, offer_number(unique), customer_company_id→customer_companies, status, items JSONB, notes, total_amount, tracking_token(unique), created_by→technicians, approved_by→technicians, approved_at/sent_at/viewed_at, timestamps)`
- `work_orders(id, company_id→companies, work_order_number(unique), customer_company_id→customer_companies, offer_id→offers, status, scheduled_date, notes, created_by→technicians, timestamps)`
- `work_order_assignments(id, work_order_id→work_orders, technician_id→technicians, assigned_at, UNIQUE(work_order_id, technician_id))`
- `inspections(id, work_order_id→work_orders, equipment_id→equipment, technician_id→technicians, inspection_date, start_time, end_time, status, inspection_data JSONB, photo_urls JSONB, inspection_number(unique), timestamps)`
- `reports(id, inspection_id→inspections, is_signed, signed_at, signed_by→technicians, qr_token(unique), sent_at, unsigned_pdf_path, signed_pdf_path, timestamps)`
- `report_jobs(id, report_id→reports, status, attempts, last_error, priority, started_at, finished_at, timestamps)`

## 3. İlişkiler
- Company ↔ Technicians/Equipment/Customer Companies/Work Orders
- Work Order ↔ Inspections (1‑N)
- Inspection ↔ Report (1‑1)
- Work Order ↔ Technicians (N‑N) through work_order_assignments

## 4. JSONB Alanları
- `equipment.template` (typed + legacy). Bölümler: key_value, checklist, table(columns), photos(field), notes(field).
- `inspections.inspection_data`: şablondaki alan adları (name/field) → deger; photos için dizi; table için satır dizisi.
- `offers.items`: teklif kalemleri (serbest şema).

## 5. Migrasyonlar
- `001_create_tables.sql` başlangıç şeması.
- `002_seed_data.sql` örnek veriler.
- `004_create_report_jobs.sql` asenkron rapor işleri.
- `005_reports_file_paths.sql` rapor dosya yolu alanları.
- `006_drop_base64_columns.sql` — eski base64 sütunlar kaldırıldı.
- `007_add_inspection_number.sql` — `inspection_number` eklendi, backfill, UNIQUE.

Seçimli migrasyon: `npm run migrate -- 007` veya `MIGRATE_ONLY=007 npm run migrate`.

## 6. Örnek Sorgular
```
-- Kayıp rapor dosyası yolu var mı?
SELECT COUNT(*) FROM reports WHERE unsigned_pdf_path IS NULL OR (is_signed AND signed_pdf_path IS NULL);

-- Bir teknisyenin gün içi çakışmaları
SELECT i.* FROM inspections i
WHERE i.technician_id = $1 AND i.inspection_date = $2
  AND ((i.start_time <= $3 AND i.end_time > $3) OR (i.start_time < $4 AND i.end_time >= $4) OR (i.start_time >= $3 AND i.end_time <= $4));
```
