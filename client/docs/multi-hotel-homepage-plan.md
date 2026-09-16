# İki otelli Sayfa İçerikleri: anasayfa ilk geçişi

## Hedef ve sınır

Tek bir "Sayfa İçerikleri" arayüzü otel seçimine göre Lago veya Azura'nın verisini
düzenler. Arayüz ve temel form bileşenleri ortaktır; kullanılabilir alanlar, veri
kaynağı, medya deposu, sürüm ve düzenleme kilidi otel bazında ayrıdır. Bu ilk
geçiş yalnızca anasayfayı kapsar. Oda ve restoran sayfaları, anasayfa yerelde
doğrulandıktan sonra aynı mekanizmaya eklenir.

Lago'nun mevcut `/api/admin/messages/namespace` ve
`/api/admin/site-pages/[pageKey]` uçları yerel Lago dosyalarını okur/yazar;
Azura seçildiğinde bu uçları olduğu gibi kullanmak içerikleri karıştırır.
Azura yazmaları Lago sunucusundan, servis tokenıyla Azura API'sine yapılmalıdır.
Tarayıcı Azura servis tokenını veya Azura yazma API'sini doğrudan kullanmaz.

## Aktif anasayfa eşleştirmesi

| Bölüm | Lago | Azura | İlk geçiş kararı |
| --- | --- | --- | --- |
| Karşılama metni | `HomePage` kök metinleri | `homepage.json.welcomeText` | Ortak dört alanlı form; Azura'nın mevcut revision'lı API'si kullanılabilir. |
| Animasyonlu tanıtım | `HomePage.TwoAnimationSection` + `homepage.json.experience` | `homepage.json.experienceText` + `experience` | Ortak görsel/metin formları; iki otelin mevcut alan adları adaptörde eşlenir. |
| Keşif kaydırıcısı | `homepage.json.carousel`: 7 görsel alanı | `homepage.json.sections.carousel`: 5 kart, görsel ve dört dil başlık/alt metin | Ortak kart editörü; otel konfigürasyonu 7/5 kartı belirler. Azura'nın genel medya ve bölüm API'si kullanılır. |
| Konaklama kartları | 3 kart: Family Swim-up, Swim-up, Superior | 3 kart: Deluxe, Fantasy, Family | Aynı form şablonu; kart kimlikleri, bağlantıları ve medya ayrı. Azura statik görsellerini veri kaynağına taşımak gerekir. |
| Olanaklar | `HomePage.Essentials`, 6 madde | `Homepage.Essentials`, 6 madde | Aynı alan grubu; mesaj anahtarları/adlandırma adaptörde ayrılır. |
| Hero ve alt banner | Lago medya JSON'unda banner ve site videosu | Azura'da mobil/masaüstü video ve alt banner görseli statik | Video için ayrı güvenli yükleme sözleşmesi gerekir; ilk ortak medya sürümüne zorla eklenmez. |

Bu tablo görsel olarak benzeyen bileşenleri eşler; iki projenin React kaynak
dosyalarını tek dosyaya taşıma hedefi değildir. Siteler ayrı deploy edilir.
Sayfaların piksel düzeyinde benzer olması, bütün veri anahtarlarının veya kart
sayılarının aynı olduğu anlamına gelmez.

## Veri ve güvenlik sözleşmesi

1. Lago için mevcut dosya okuma/yazma davranışı değişmeden kalır. Azura için
   ayrı bir sunucu adaptörü oluşturulur. İstemciden gelen `hotelId`, dosya yolu
   veya uzak URL olarak kullanılamaz; yalnızca `lago`/`azura` izin listesine
   göre önceden tanımlı adaptör seçilir.
2. Otel bazlı sayfa/bölüm konfigürasyonu hangi alan ve kartların gösterileceğini
   belirler. Azura'da olmayan Lago kartları ve sayfa detayları gösterilmez.
3. Azura yazmalarında GET'in döndürdüğü alan/sayfa revision'ı `If-Match` ile
   gönderilir; eski sürüm `409` olur. Görsel ve metin kayıtları birbirinin
   JSON alanlarını silmez. Düzenleme kilidi anahtarları en az
   `hotelId + pageKey/bölüm` içerir; bir otelin kilidi ötekini etkilemez.
4. Görseller kendi otelinin kalıcı uploads dizininde tutulur. Azura'nın mevcut
   experience görsel API'si bütün anasayfa medyasını yükleyen genel bir uç gibi
   varsayılmaz; yeni alanlar için doğrulanmış medya sözleşmesi gerekir.
5. Dört dildeki mevcut metinler, baştaki/sondaki boşluklar dahil veri taşıma
   sırasında aynen korunur. Seçili dilde düzenleme yapılır; kayıt API'si dört
   dilin tamamını doğrular. Kayıt sonrası ilgili otelin dört anasayfa yolu
   yeniden doğrulanır.

## Kontrollü uygulama sırası

1. Azura'da anasayfanın **kalan** alanları için tek tek bileşen route'ları
   üretmeden sayfa/bölüm tabanlı okuma-yazma ve görsel yükleme sözleşmesi
   tanımlanır. Mevcut `welcomeText`, `experienceText`, `experience` ve
   bunların API'leri korunur; geçişte veri kaybı olmaz.
2. Lago'da yalnızca Azura anasayfası için ortak "Sayfa İçerikleri" görünümü
   açılır. İlk sürümde karşılama, keşif kaydırıcısı, tanıtım ve olanaklar alanları aynı arayüzden
   yönetilir; kalan alanlar Azura API'si hazır oldukça eklenir.
3. Yerelde dört dil, medya yükleme, iki sekmede çakışma, Lago/Azura içerik
   izolasyonu ve yeniden başlatma sonrası kalıcılık doğrulanır.
4. Ardından odalar ve restoran ana sayfası için ayrı alan/kart eşleştirmesi
   yapılır; Azura'da istenmeyen detay sayfaları editörde açılmaz.

Bu not bir uygulama sözleşmesi taslağıdır; mevcut API veya site davranışını
değiştirmez.
