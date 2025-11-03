# Özellikler (Features)

## Phase 1 - MVP

**Hedef:** 1 hafta içinde tamamlanacak temel özellikler

### Feature 1: Kullanıcı Yönetimi
- Kullanıcı kayıt ve giriş
- 4 rol: Super Admin, Firma Admini, Mühendis/Teknisyen, Müşteri
- Role-based yetkilendirme
- Multi-tenant yapı (her firma ayrı)

### Feature 2: Firma Yönetimi
- Super Admin: Firma ekle/sil/düzenle
- Firma bilgileri yönetimi
- Her firma izole veri

### Feature 3: Müşteri Yönetimi
- Firma Admini: Kendi müşterilerini ekle/düzenle
- Müşteri firmaları bilgileri
- Her müşteri bir firmaya ait

### Feature 4: Ekipman Yönetimi
- Ekipman ekleme, düzenleme, listeleme, silme (CRUD)
- Ekipman tipleri: elektronik, mekanik, mekatronik
- Örnek ekipmanlar: vinç, hava tankı, iş makineleri
- Her ekipman bir müşteriye ait

### Feature 5: Ekipman Şablon Yönetimi
- Her ekipman tipi için farklı muayene şablonları
- Şablonların arayüzden kolayca düzenlenmesi
- Esnek ve dinamik yapı
- JSONB kullanımı (PostgreSQL)

### Feature 6: İş Emri Sistemi
**Açıklama:** Müşteriler genelde tek ekipman için değil, birden fazla ekipman için muayene yaptırır. İş emri, birden fazla muayeneyi gruplar.

**İşlevler:**
- İş emri oluştur
- İş emrine birden fazla ekipman/muayene ekle
- İş emri altında muayeneleri organize et
- Container görevi görür

### Feature 7: Muayene Formu Doldurma
- Mühendis/Teknisyen tarafından kullanılır
- Ekipman tipine özel dinamik formlar
- İş emri kapsamında muayene yapma
- Muayene verilerini kaydet

### Feature 8: PDF Rapor Oluşturma
- Muayene verilerinden otomatik PDF rapor
- Her ekipman tipi için farklı rapor şablonları
- Şablonlar arayüzden düzenlenebilir
- Esnek ve dinamik rapor tasarımı

### Feature 9: Muayene Listeleri
- Yapılan muayeneleri listele
- Filtrele ve ara
- Muayene geçmişi
- İş emri bazlı görünüm

## Phase 2 - Enhanced Features
<!-- İleride planlanacak -->

## Phase 3 - Advanced Features
<!-- İleride planlanacak -->

## Feature Priority Matrix

**Must-have (MVP):**

- Firma yönetimi
- Müşteri yönetimi
- Ekipman yönetimi
- Kullanıcı yönetimi
- Ekipman şablon yönetimi
- İş emri sistemi
- Muayene formu doldurma
- PDF rapor oluşturma
- Muayene listeleri

**Should-have (Phase 2):**
<!-- İleride planlanacak -->

**Could-have (Phase 3):**
<!-- İleride planlanacak -->
