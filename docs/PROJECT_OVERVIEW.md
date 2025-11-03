# Proje Genel Bakış

## Proje Adı ve Tanımı

**Proje Adı:** Dijital Muayene ve Raporlama Programı

**Tanım:**
Ekipmanların (elektronik, mekanik, mekatronik - vinç, hava tankı, iş makineleri vb.) periyodik muayenelerini yapan mühendislik firmaları için web tabanlı bir dijital muayene ve raporlama programı. Muayene ve raporlama süreçlerini dijitalleştirir ve hızlandırır.

## Problem Tanımı

Mühendislik firmalarının ekipman muayene süreçleri manuel ve yavaştır. Muayene verilerinin toplanması, raporlanması ve müşterilerle paylaşılması zaman alıcıdır. Bu süreçlerin dijitalleştirilmesi ve hızlandırılması gerekmektedir.

## Hedef Kullanıcılar

### 1. Super Admin
**Kim:** Platform sahibi, sistem yöneticisi

**Sorumluluklar:**
- Firma ekle/sil
- Genel ayarları kontrol et
- Tüm sistemi yönet

### 2. Firma Admini
**Kim:** Her mühendislik firmasının kendi yöneticisi

**Sorumluluklar:**
- Kendi firmasını yönet
- Mühendisleri ekle/yönet/yetkilendir
- Müşterileri yönet
- Firma düzeyinde raporlar

### 3. Mühendis/Teknisyen
**Kim:** Saha görevlisi, muayene yapan personel

**Sorumluluklar:**
- Ekipman muayenelerini yap
- Muayene formlarını doldur
- Raporları oluştur
- Firmaya ait

### 4. Müşteri
**Kim:** Ekipman sahibi firmalar

**Sorumluluklar:**
- Kendi ekipmanlarının muayene sonuçlarını görüntüle
- Raporlara eriş
- Mühendislik firmasına ait

## Çözüm Yaklaşımı

Multi-tenant SaaS yapısı ile her firma kendi alanında çalışır. Her firma ayrı veri ve kullanıcı yönetimine sahiptir.

Muayene süreçleri:
- İş Emri sistemi ile birden fazla ekipmanın muayenesi gruplanır
- Ekipman tipine özel dinamik muayene formları
- Otomatik PDF rapor oluşturma
- Esnek ve düzenlenebilir rapor şablonları

## Proje Hedefleri

**Kısa Vadeli (MVP - 1 hafta):**
- Temel kullanıcı, firma, müşteri yönetimi
- İş emri ve ekipman yönetimi
- Muayene formu doldurma
- PDF rapor oluşturma

**Uzun Vadeli:**
- <!-- İleride eklenecek -->

## Başarı Kriterleri

- Mühendislik firmalarının muayene süreçlerini dijitalleştirir
- Manuel rapor hazırlama süresini azaltır
- Müşterilerin raporlara kolay erişim sağlar
- Multi-tenant yapı ile birden fazla firma kullanabilir
