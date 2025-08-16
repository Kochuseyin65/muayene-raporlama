# AI Destekli Full‑Stack Proje Dokümantasyon – Muayene ve Raporlama Sistemi (Detaylı)

## 1. Projenin Özeti (Geliştirilmiş Detay)

* **Proje ne?**
  Mühendislik firmalarının sahada gerçekleştirdiği muayene ve test süreçlerini, teklif hazırlamadan rapor onayına kadar tek bir dijital platformda toplayan, çoklu firma destekli web tabanlı bir yönetim sistemi. Sistem; teklif oluşturma, iş emri başlatma, saha muayene verilerinin girilmesi, fotoğraf ve belge eklenmesi, otomatik PDF rapor üretimi ve e-imza onayı gibi adımları entegre bir akışta gerçekleştirir. Tüm kullanıcılar kendi rol ve yetkilerine göre özelleştirilmiş arayüzler üzerinden çalışır.
* **Kim kullanacak?**

  * Mühendislik firmaları
  * Muayene mühendisleri(teknisyenler)
  * Firma yöneticileri
  * Müşteri firmalar (rapor görüntüleme ve onay için)
* **Ne işe yarayacak?**

  * Tüm muayene sürecini kâğıt, e-posta ve farklı sistemler yerine tek bir merkezi platformda toplar.
  * Tekliften rapora kadar olan süreci hızlandırır, hata payını azaltır.
  * E-imza ile resmi onay sürecini dijitalleştirir.
  * QR kod desteği sayesinde sahadan veya ofisten anında rapor erişimi sağlar.
  * Tüm verileri güvenli bir şekilde saklar ve gerektiğinde geçmişe dönük arşiv taraması yapılmasını sağlar.
  * Farklı firma ve ekipman türleri için dinamik şablonlarla esnek raporlama imkânı sunar.
* **Yapmayacağı şeyler (out of scope)**

  * Muhasebe ve faturalama işlemleri
  * Üçüncü parti CRM entegrasyonu
  * Saha ekipman/donanım envanteri yönetimi
   


## 2. Özellik Listesi (Detaylandırılmış)

* Çoklu firma desteği (her firma kendi kullanıcılarını ve verilerini yönetir)
* Teklif oluşturma ve onay akışı (yetkili teknisyen onayı ile iş emrine dönüşür)
* İş emri yönetimi (durum takibi, atamalar)
* Dinamik muayene şablonları (farklı ekipman tipleri için)
* PDF raporlama (base64 formatında API üzerinden)
* E-imza entegrasyonu (yetkilendirilmiş kullanıcılar için)
* tenkisyen yetkileri permissions listesi ile belirlenecek. her endpointte işlem yapılmadan önce o kullanıcının o yetkiye sahip olup olmadığına bakılır. her şey yetki ile kontrol edilir. yani sabit roller yoktur. kullanıcının izini varsa erişebilir. ayrıyeten bir firma admini ve süper admin olacak. ve bu adminler için ayrı bir sayfa olması lazım
* QR kod ile rapor takibi (doğrulama ve görüntüleme)
* Mobil uyumlu responsive arayüz
* Takvim ve hatırlatma sistemi (yaklaşan muayene tarihleri için)

**Öncelik sırası:**

1. Kullanıcı/firma yönetimi
2. Teklif modülü
3. İş emri modülü
4. Muayene ve raporlama modülü
5. E-imza entegrasyonu
6. QR kod ve takvim entegrasyonu


## 3. Veri Yapısı (Database – Detaylı)
*   **muayene firması (tenet/inspection company)**
    * id bilgisi
    * ad bilgisi
    * vergi no bilgisi
    * adres bilgileri
    * iletişim bilgileri
    * logo url bilgisi

    
*   **teknisyen (technician)**
    * id bilgisi
    * bağlı olduğu muayene firma id bilgisi
    * ad bilgisi
    * soyad bilgisi
    * e-posta bilgisi
    * telefon bilgisi
    * e imza bilgileri (pin vs...)
    * yetkileri (permissions listesi)

*   **müşteri firma (customer company)**
    * id bilgisi
    * bağlı olduğu muayene firma id bilgisi
    * ad bilgisi
    * vergi no bilgisi
    * adres bilgileri
    * iletişim bilgileri
    * email adresi rapor bilgileri için
    * yetkili bilgileri

*   **ekipman (equipment)**
    * id bilgisi
    * bağlı olduğu muayene firmasının id bilgisi
    * ad bilgisi
    * tür bilgisi (hangi ekipman türüne ait olduğunu belirtir)
    * şablon => emuayene verileri girilirken gerekli bilgilerin olduğu şablon. bu şablonlar muayenelere kopyalanır ve valueler ile doldurulur. bu şablon json formatında ve admin tarafından tamamen değiştirilebilir. ve bu json sections lardan oluşur. çünkü ekipman bilgiler sectionlardan oluşur(mesela genel bilgiler, teknik bilgiler, genel değerlendirme vb.). bu şablonda bu sectionlarda hangi muayene bilgilerinin girilmesi gerekli olduğu bulunur. ekipmanlar da firma adminleri tarafından düzenlernir,eklenri, silinir örn:
    ```json
        {
            "sections": [
                {
                    "title": "Genel Bilgiler",
                    "ekipman": "kule vinç"
                    "fields": [
                        {
                            "name": "muayene_tarihi",
                            "type": "date",
                        },
                        {
                            "name": "muayene_yeri",
                            "type": "text",
                        }
                    ]
                },
                {
                    "title": "Teknik Bilgiler",
                    "fields": [
                        {
                            "name": "tonaj",
                            "type": "int",
                        },
                        {
                            "name": "yukseklik",
                            "type": "int",
                        }
                    ]
                }
            ]
        }
    ```
    
    ama bunu postre sql uygun daha mantıklı bir yollada yapabilirsin. sadece bjson ile olmask zorunda değil tamamı.


*   **iş teklifi (offer)**
    * id bilgisi
    * otomatik oluşturulan iş teklifi numarası (order-98493 şekine benzer olabilir)
    * bağlı olduğu müşteri firma id bilgisi
    * tarih bilgisi
    * durum bilgisi
    * içinde bulunan ekipmanlar ve birim fiyat, adet bilgileri (ekipmanlar ekipman id ile ekipman modeline bağlıdır)

*   **iş emri (workOrder)**
    * id bilgisi
    * otomatik oluşturulan iş emri numarası
    * bağlı olduğu müşteri firma id bilgisi
    * iş emrine atanmış teknisyen/kullanıcı id bilgileri
    * var ise bağlı olduğu iş teklifi id bilgisi
    * tarih bilgileri
    * durum bilgisi (başlanmadı, başlandı, tamamlandı, onaylandı, gönderildi vs...)
    
*   **muayene (inspection)**
    * id bilgisi
    * bağlı olduğu iş emri id bilgisi
    * bağlı olduğu ekipman id bilgisi => muayeneler ekipman modeline bağlıdır çünkü şablonlarını oaradan alır. 
    * muayeneyi yapan teknisyen id bilgisi
    * muayenenin yapildigi gün ve saat aralığı => başka bir muayene için bu saat aralığını giremez. yani aynı anda 2 muayene yapılamaz. çünkü aynı anda 2 muayene geçtiği zaman resmiyete, firmanın gerekli reami kurhm tarafından ceza yeme ihtimali var. ama uygulama da bu muyanenin gerçekleştiği vaktin çok önemi yok. sadece resmiyette gözükmemesi için aynı saat aralığı seçilemez. ama programda istediği saattr yapabilir ama sadece farklı saatleri seçmesi lazım
    * tarih bilgileri
    * durum bilgisi (başlanmadı, başlandı, tamamlandı, onaylandı, gönderildi vs...)
    * içinde bulunan muayene verileri => bu veriler ekipman modelindeki şablon alınarak valueler eklenerek doldurulur. yani oradaki şablonun value eklenmiş hali
    * içinde bulunan fotoğrafların url bilgileri

*   **rapor (report)**
    * id bilgisi
    * bağlı olduğu muayene id bilgisi
    * imzalanmamış base64 => eğer muayene bitmiş ise bu muayene verileri base64 formatında PDF olarak kaydedilir
    * imzalı base64 => eğer muayene bitmiş ve e-imza ile imzalanmış ise bu muayene verileri base64 formatında PDF olarak kaydedilir
    * imzalama durumu
    * imzalama tarihi
    * imzalayan teknisyen id bilgisi


**İlişkiler:**



## Modüller
*   **teknisyen/auth/permissions modülü**
    > teknisyenlerin yetkileri permissions listeleri ile belirlenecek. bu permissions listelerindeki permissionlar firma admini tarafından atanacak teknisyene. (createWorkOrder, CreateOffer vb gibi...). her api çağrısı sırasında işlem yapmak isteyen teknisenin permissions listesi kontorl edilip listede o eylemi yapmak için gerekli zini varsa işlem yapılır. teknisyen ile alakalı bilgiler firma admini tarafından düzenlenir.
*   **muayene firmaları/tenet modülü**
    > muayene firmalarının tenet yapıda yani verilerinin tamamen birbirinden bağımsız ve karışmasını engelleyecek bir sorun olmaması lazım. muayene firmaları süper admin tarafından düzenlernir/eklenir/silinir.
*   **iş teklifi modülü**
    > iş teklifi aslında şu şekil gerçeklerşir. müşteri firma sözlü yol veya herhangi bir yol ile muayene firmasına ulaşır. ve ellerinde muayenelerini yaptırmasının gerekli olduğu ekipmanların olduğunu söyler. muayene firması gerekli ekipmanları, birim fiyatlarını, adetlerini, gerekirse notları ekler ve bir iş teklifi oluşturur. bu iş teklifi firma admini veya gerekli permissions a sahip bir teknisyen tarafından onaylandıktan pdf'e dönüştürülüp sonra otomatik olarak müşteri firma db modelinde bulunan email adresine gönderilir. gönderilen emailde pdf linki sunucuda dosyanın bulunduğu bir indirme sayfasına yönlendirilir. ve bu pdf i indirmek için bu linke tıklandığında iş teklifi durum bilgisi "görüldü" olacak. ve sonra admin veya gerekli permissionsa sahip bir teknisyen tarafından iş teklifi iş emrine dönüştürülecek. bu dönüştürme işlemide arka tarafta teklife uygun iş emrinin oluşturulup iş emrine iş teklifindeki ekipmanların mauyenesinden eklemek db deki "muayene" ile. ama bu iş teklifinin iş emrine dönüştürülmesi zorunlu değil. iş teklifi reddedilmiş de olabilir. 
*   **ekipman modülü**
    >ekipman modülü sistemde bulunan ekipmanlardır (vinç, kazan, hava tankı vs...). ekipman modelinde bulunan şablonlarda bu ekipmanın muayenesi yapılırken gerekli bilgilerin olduğu şablondur. bu şablon bir ekipmanı muayene modeli oluşturulduğunda oradaki şablonada kopyalanır ve valuelar ile doldurulur. bu şablon sectionalardan oluşur. ve sectionlar tamamen dinamiktir. çünkü herhangi iki ekipmanın maueyensi yapılırken istenen bilgiler ve bilgi çeşitliliği çok farklı oluyor (mesela kule vinç, yakıt tankı). ve ayrıyeten sectionlar şu 4 tipte olabilir. 1. düz istenen key:value şeklinde yani. bir ekipmanın bir özelliği:ölçülen değeri şeklinde. bir diğeri 2. tablo şeklinde. bazen ekipmanın değerleri tablo şeklinde girilir. bir de 3. hazır cevaplar ile. yani ekipman özelliği:hazır cevaplardan biri(uygun/uygunsuz gibi...) bir diğeri ise ekipmana ait muayene de girilmek istenilen fotoğrafların girildiği alan. bu fotoğraflar sunucuda kaydedilir. ve şablonda url si kaydedilir veya base64. ekipmanlar firma admini tarafından düzenlernir veya gerekli permissionsa sahip biri tarafından
*   **iş emri modülü**
    > iş emri oluşturmak için gerekli permissionsa sahip teknisyen veya admin tarafından oluşturulur. gerekli ekipmanlar seçilerek iş emri oluşturulur ve bu iş emri altına seçilen ekipmanların muayenesi(db "muayene/inspection") oluşturulur. iş emri iş teklifinden de dönüştürülerek oluşturulabilir ama zorunlu değil. direkt olarak da oluşturulabilir ki çoğu zaman direkt oluşturulur. iş emrinde de durum bilgileri vardır (başlanmadı, başlandı, tamamlandı, onaylnadı, gönderildi vs...)

*   **muayene modülü**
    >muayene modülü gerekli ekipmanın muayenesinin yapıldığı modüldür. hangi ekipmana ait ise o ekipmana ati şablon kopyası bunun db modelinde de tutulur. ve oradaki sectionalar altınfaki field lara veya tablolara veya hazır cevaplara veya fotoğraflara valular eklenerek değerler de doldurulur. vemuayenenin raporu oluşturulması için muayenenin tamamının doldurulmasına gerek yok. muayene yarı doldurulup kaydet butonuna basıldığında da o muayenenin raporu oluşturulur ama rapor tamamlanmamış olur sadece ve pdf te doldurulmasmış valuelar boş gözükür sadece. ama tamamlanmamış bir muayeneye e-imza atılamaz kaydedildiğinde şablon arka tarafta bir html e render edilir ve bu html de pdf e dönüştürülür bir html to pdf kütüphanesi ile. ve bunun sonucunda db rapor modelindeki pdf değerine base 64 formatında kaydedilir. evet pdfleri base64 formatında depolayacağım db de. ve ayrıyeten bu muayene raporları e imza ile imzalanacak. onu aşağıda e imza modülünde anlatacağım.
*   **rapor modülü**
    >bir muayene kaydedildikten sonra arka tarafta profesyonel/kurumsal bir html şablonuna aktarılıp/doldurulup html metni de pdf e dönüştürülecek bir html to pdf kütüphanesi ile. ve bu pdf base64 formatında db raport modelinde kaydedilecek. sonra eğer bu muayene tamamlanıp onaylandıktan sonra muayeneyi gereçekleştiren teknisyen tarafında e imza ile imzalanması lazım raporun.
*   **e-imza modülü**
    >e-imza modülü bir muayenenin tamamlanıp onaylandıktan sonra teknisyen tarafından e imza ile imzalanmıdır. e-imza işlemi client tarafında yapılacak. çünkü e imza işlemi teknisyenin cihazı dışına çıkamaz gerekli güvenlik protokollerinden dolayı. teknisyen bilgisayarına esigner adnda bir e-izmalama programı indirecek. bu program localde bir sunucu başlatır ve beelirli endpointleri dinlemeye başlar. bizim frontend tarafında bir rapor için e imzalan tuşuna basıldığında ilk olarak sunucuya o pdf i base64 formatında ve teknisyenin db modelinde bulunan eimza pinini alacak.sonra bu localde çalışan programın endpointine base64 ü ve pin i gönderecek. ve program bunu otomatik olarak imzlayacak ve imzalanmış base64'ü frontende geri dönecek. ve frontend bu imzalanmış base64'ü geri sunucuya gönderecek. ve sunucu db rapor/report modeline e signed pdf alanına bu base64'ü koyacak. ve bu localde çalışacak program hazır var elimde. ens signer adında bir program ve aşağıda programın localdeki api endpointleri var

    signer.md dosyasında bu endpointlerin kullanıldığı örnek bir kod dosyası var
    
*   **email ve takip modülü**
    >email gönderme işlemi rapor, ve iş teklifi modüllerinde olacak. bir muayene imzlanadıktan sonra email ile müşteri firma mailine gönderilecek. ayrıyeten bir iş emri altındaki tüm muayeneler bittiğinde o iş emri altındaki maueyenlerin tamamının raporları bir rar/zip formatında gönderilecek.  ve ayrıyeten iş teklifi modülünde de bahsettiğim gibi orada da kullanılacak. ama orada biraz farklı olacak çünkü orada takip sitemi de olacak. iş teklifi pdf i bir url şeklinde gönderilecek. ve o url pdf i indirecek. ve müşteri o urlye tıkladığı zaman o iş teklifinin durumu görüldü olacak. 


    

## 5. Akışlar (Detaylı)

**Rapor Onay Süreci:**

1. iş teklifi oluşturulur.
    1. iş teklifi müşteriye gönderilir.
    2. iş teklifi admin tarafından veya gerekli permission'a sahip bir teknisyen tafından onaylanır.
    3. iş teklifi admin veya gerekli permission'a sahip bir teknisyen tarfında iş emrine dönüştürülmek istenir.
    4. iş teklifinin altındaki ekipmanlara göre iş emri ve altındaki gerekli ekipmanlara ait muayeneler oluşturulur
2. direkt gerekli ekipmanlar girilir ve program gerekli iş emrini ve altındaki ekipmanların muayenesini oluşturur
    1. iş emrine admin tarafında gerekli teknisyenler atanır. ve iş emri altındaki muayeneler bu atanmış teknisyenler tarafından yapılır.
    2. maueyene gerekli teknisyen tarafından yapılrı ve kaydedilir ve tamamlanır.
    3. muayene rapora dönüştürülür
    4. rapor onaylanır
    5. rapor imzalanır
    6. rapor e mail ile gönderilir


## 7. Tasarım Notları

* Modern, sade ve mobil uyumlu UI
* Renk paleti: siyah, gri, beyaz
* QR kod rapor detay sayfasında görünür

## 8. Teknik Kurallar

* projede database olarak postresql kullanılacak. 
* Backend: Node.js (Express, typescript olmadan) + Postre SQl
* Frontend: React.js (TypeScript olmadan) redux-toolkit de kullanılabilir state yönetimi ve bilgi aktarımı için
* Kod standardı: camelCase

