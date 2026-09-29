# Azura dinamik sayfalar: Lago bağlantı katmanı

Azura seçiliyken menüdeki Sayfalar, `/panel/azura/sayfalar` adresine açılır.
Liste ve oluşturucu Lago ile aynı `PagesManager` ve `PageBuilder` bileşenleridir.
Lago'nun yerel kayıt, çöp kutusu ve edit-lock akışı korunur.
Azura, aşağıdaki ayrı proxy uçlarını ve revision korumasını kullanır.

## Bağlantı

Mevcut `AZURA_EXPERIENCE_API_URL` değişkeninin güvenilir sunucu kökü ve
`AZURA_SERVICE_TOKEN` yeniden kullanılır. Yeni ortam değişkeni gerekmez.
Token yalnız sunucudan Azura'ya gönderilir; yönlendirmeler takip edilmez.

Panel uçları `/api/admin/azura/pages` altında:

- GET/POST kök: listele / yalnız taslak oluştur.
- GET/PUT/DELETE `[id]`: oku / save-publish-unpublish / kalıcı kayıt silme.
- GET `[id]/history`: kaydı ve geçmişini oku.
- POST `[id]/history/[versionId]/restore`: yalnız taslağa geri dön.
- GET/POST `images`: ayrı dinamik sayfa görsel kütüphanesi.

İçerik POST gövdesi `{draft}`; PUT gövdesi `{action:"save",draft}` veya
`{action:"publish"}` / `{action:"unpublish"}` olur. Draft yalnız
schemaVersion, template, slugs, showContactSection, hero, navigation,
seo ve sections içerir. Silme ve restore gövdesizdir.

PUT, DELETE ve restore tırnaklı If-Match ister. 409 yanıtı korunur;
proxy otomatik tekrar deneme veya otomatik revision yenileme yapmaz.
JSON istekleri akış sırasında 128 KiB ile sınırlandırılır.

Panel yanıtı `{page,record,revision,mediaOrigin}` şeklindedir. Liste
`{pages:[{page,record,revision,mediaOrigin}],mediaOrigin}` döndürür.
Silme yanıtında ayrıca `deleted:true` bulunur. `page` mevcut Lago formuna
uygun yönetici görünümüdür; `record` taslak/yayın/geçmiş ayrımını korur.

Her uç panel oturumu ve içerik düzenleme yetkisi ister. Yayınlama/yayından
kaldırma ayrıca yayınlama, silme ayrıca silme yetkisi ister. Yazmalarda
aynı-origin ve hız sınırı kontrolleri uygulanır.

## Arayüz davranışı

- Mevcut Lago listesi ve oluşturucusu kullanılır; ayrı kopya form yoktur.
- Azura için yerel edit-lock, yerel medya ve yerel çöp kutusu çağrılmaz.
- Görsel seçimi `/uploads/dynamic-pages/` ile sınırlı kalmalı; önizleme
  mediaOrigin üzerinden, kayıt ise göreli yol ile çalışır.
- Save ve publish farklı işlemler. Save başarılı, publish başarısız olursa
  kaydedilmiş taslak ve yeni revision korunur; tam başarı gösterilmez.
- 409 veya doğrulanamayan kayıt sonucunda form korunur, yeniden yazma
  güncel kayıt açık onayla yüklenene kadar engellenir. Yeni oluşturma sonucu
  belirsizse, mükerrer POST yerine Sayfalar listesi kontrol edilmelidir.
- Restore yayına dokunmaz. Yerel değişiklikleri bırakmak açık onay ister.
- Azura DELETE çöp kutusuna taşımaz; kalıcı kayıt siler, görselleri silmez.
- Header menü entegrasyonu ayrı iştir; navigation.visible henüz sitede
  menüde görünme garantisi değildir.

Azura'nın depolama kuyruğu yalnız aynı Node.js sürecini korur.
Bu aşamada gerçek Azura kayıtlarına yazılmamıştır.

## Doğrulama

`npm run test:admin` proxy ve route yetki testlerini kapsar.
`npm run test:pages` mevcut Lago sayfa modeli regresyonlarını kapsar.
`node --test tests/azura-pages.integration.test.mjs` gerçek Next sunucusu ve
bellek içi Azura sözleşme sunucusuyla HTTP yaşam döngüsünü test eder.
Önceden build alınmış izole kopyada `AZURA_PAGES_TEST_PRODUCTION=1` kullanılır.
Test, panel layout verilerini geçici dizine kopyalar; kullanıcı verisine yazmaz.
Gerçek Azura sunucusuyla tarayıcı/uçtan uca ve piksel testi yapılmamıştır.
