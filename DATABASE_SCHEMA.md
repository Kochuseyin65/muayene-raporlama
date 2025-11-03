# Veritabanı Şeması

## Veritabanı Genel Bakış

**Database:** PostgreSQL
**ORM:** Prisma

## Tablolar (Bağımlılık Sırasına Göre)

### Seviye 1 - Temel Tablolar (Bağımsız)

#### 1. companies
**Açıklama:** Multi-tenant yapı - Mühendislik firmaları (Tenant)

**İlişkiler:**
- Has Many: users
- Has Many: customers
- Has Many: equipments
- Has Many: work_orders

---

#### 2. equipment_types
**Açıklama:** Ekipman tipleri (Sabit veri - vinç, hava tankı, iş makinesi, vb.)

**İlişkiler:**
- Has Many: equipment_templates
- Has Many: equipments

---

### Seviye 2 - Company'ye Bağlı Tablolar

#### 3. users
**Açıklama:** Kullanıcılar (4 rol: SUPER_ADMIN, COMPANY_ADMIN, ENGINEER, CUSTOMER)

**Bağlı Olduğu:**
- companies (company_id) - SUPER_ADMIN hariç

**İlişkiler:**
- Belongs To: companies
- Has Many: work_orders (created_by)
- Has Many: inspections (engineer_id)

---

#### 4. customers
**Açıklama:** Müşteri firmalar (Ekipman sahibi firmalar)

**Bağlı Olduğu:**
- companies (company_id)

**İlişkiler:**
- Belongs To: companies
- Has Many: equipments
- Has Many: work_orders

---

#### 5. equipment_templates
**Açıklama:** Ekipman muayene şablonları (JSONB - dinamik form alanları)

**Bağlı Olduğu:**
- equipment_types (equipment_type_id)
- companies (company_id) - opsiyonel (null ise genel şablon)

**İlişkiler:**
- Belongs To: equipment_types
- Belongs To: companies (opsiyonel)

**Notlar:**
- template_data (JSONB): Form alanlarını tanımlar
- Her equipment_type için farklı şablon

---

### Seviye 3 - İkinci Seviyeye Bağlı

#### 6. equipments
**Açıklama:** Ekipmanlar

**Bağlı Olduğu:**
- companies (company_id)
- customers (customer_id)
- equipment_types (equipment_type_id)

**İlişkiler:**
- Belongs To: companies
- Belongs To: customers
- Belongs To: equipment_types
- Has Many: inspections

**Notlar:**
- Firma admini tarafından eklenir
- Her ekipman bir müşteriye ait

---

#### 7. work_orders
**Açıklama:** İş emirleri (Birden fazla muayeneyi gruplar - container)

**Bağlı Olduğu:**
- companies (company_id)
- customers (customer_id)
- users (created_by)

**İlişkiler:**
- Belongs To: companies
- Belongs To: customers
- Belongs To: users (created_by)
- Has Many: inspections

**Notlar:**
- status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED

---

### Seviye 4 - Üçüncü Seviyeye Bağlı

#### 8. inspections
**Açıklama:** Muayeneler (Ekipman muayene verileri)

**Bağlı Olduğu:**
- work_orders (work_order_id)
- equipments (equipment_id)
- users (engineer_id)

**İlişkiler:**
- Belongs To: work_orders
- Belongs To: equipments
- Belongs To: users (engineer_id - Mühendis)
- Has One: inspection_reports
- Has Many: file_uploads

**Notlar:**
- inspection_data (JSONB): Doldurulmuş form verileri
- status: PENDING, IN_PROGRESS, COMPLETED
- result: UYGUN, UYGUN_DEGIL, SARTLI_UYGUN (opsiyonel)

---

### Seviye 5 - En Üst Seviye

#### 9. inspection_reports
**Açıklama:** PDF raporlar

**Bağlı Olduğu:**
- inspections (inspection_id)

**İlişkiler:**
- Belongs To: inspections

**Notlar:**
- pdf_path: Oluşturulan PDF dosyasının yolu

---

#### 10. file_uploads
**Açıklama:** Muayene fotoğrafları ve dosyaları

**Bağlı Olduğu:**
- inspections (inspection_id)

**İlişkiler:**
- Belongs To: inspections

**Notlar:**
- file_path: Local disk path (MVP) veya cloud URL (ileride)
- file_type: image/png, image/jpg, application/pdf
- 1 inspection → N file_uploads

---

## Entity Relationship Diagram (Metin)

```
companies (1) ──────< (N) users
    │
    ├──────< (N) customers
    │           │
    │           └──────< (N) equipments ──┐
    │                                     │
    └──────< (N) work_orders              │
                    │                     │
                    └──────< (N) inspections ────< (1:1) inspection_reports
                                    │
                                    └──────< (N) file_uploads

equipment_types (1) ──────< (N) equipment_templates
       │
       └──────< (N) equipments
```

---

## Genel Standart Alanlar

Her tabloda:
- `id` (Primary Key - UUID veya SERIAL)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

Bazı tablolarda (audit için):
- `created_by` (user_id)
- `updated_by` (user_id)
- `deleted_at` (Soft delete - opsiyonel)

---

## Sonraki Adım

Her tablo için detaylı alan tanımları ayrı ayrı eklenecek:
- Alan adları
- Veri tipleri
- Null/Not Null
- Default değerler
- Constraintler
- İndeksler
