# Özet ve Yol Haritası (Phases)

Bu belge, gerçekleştirilen işleri (faz bazlı) ve önerilen sonraki adımları özetler.

## Tamamlananlar
- Faz 2: CRUD modülleri (Customers, Equipment, Technicians), DataTable, toast/hata deseni
- Faz 3: İş akışı modülleri (Offers, Work Orders); detay sayfaları ve aksiyonlar
- Faz 4: Muayene + Raporlama
  - Dinamik muayene formu (typed + legacy), tablo editörü
  - Fotoğraf yükleme/önizleme/silme, alan bazlı bağlama
  - Save/Complete/Approve; saat normalizasyonu ve net hata mesajları
  - Rapor prepare (senkron/asenkron + job polling), indirme, yerel imza
  - INSP-… benzersiz muayene numarası (007 migrasyon)
  - Helmet CORP düzeltmesi (görsel yükleme)
  - Equipment Template Builder: Görsel şablon düzenleyici (JSON’suz)
- Rapor görselleştirme güncellemesi
  - Backend rapor indirme uçları imzalı → imzasız fallback mantığıyla QR kodlu PDF üretir (`REPORT_PUBLIC_BASE_URL`).
  - Inline PDF önizleme (InspectionReportPage) ve public `/reports/public/:token` sayfası, tek buton indirme + yenileme.
  - PDF alt bilgisinde token yerine public doğrulama linkine yönlenen gerçek QR görseli bulunur.
- Teknisyen odaklı sayfalar: “Benim İş Emirlerim” ve “Benim Muayenelerim” menüye eklendi; backend `mine=true` filtresi ile yalnızca oturumdaki teknisyene atanan kayıtlar listelenir, frontend’de ilgili menüler `viewMyWorkOrders` / `viewMyInspections` izinleri ile açılır.

## Sıradaki Öneriler (Faz 5+)
- Dashboard kartları (açık teklifler, yaklaşan iş emirleri, bekleyen rapor/imza)
- Public sayfalar (teklif tracking ve rapor public görünüm)
- Rapor viewer (PDF.js) ve inline önizleme
- Gelişmiş validasyon (frontend alan bazlı) ve i18n
- CI/CD ve üretim profil dosyaları (Docker, env matrix)
