# Panel Kimlik Doğrulama Güvenliği

## Giriş istek sınırları

Giriş endpoint'i birbirini tamamlayan üç başarısız deneme sayacı kullanır:

- Kullanıcı hesabı: 15 dakikada 15 başarısız deneme.
- IP ve kullanıcı birleşimi: 15 dakikada 5 başarısız deneme.
- IP adresi: 15 dakikada 30 başarısız deneme.

Bunlardan önce, parola doğrulama maliyetini sınırlamak için IP başına dakikada 20
giriş isteğine izin veren kısa süreli burst kontrolü uygulanır. Başarılı giriş,
ilgili kullanıcı ve IP+kullanıcı başarısızlık sayaçlarını sıfırlar. Hatalı kullanıcı
adı ve hatalı parola aynı genel yanıtı üretir.

Limit aşıldığında API `429 Too Many Requests` ve `Retry-After` başlığı döndürür.
Giriş formu bu süre boyunca butonu kilitler ve kalan süreyi gösterir.

## Kullanıcılar ve roller

Sunucu ortam değişkenleriyle tanımlanan hesap, kurtarma erişimi sağlayan sistem
yöneticisidir. Bu hesap silinemez ve `admin` rolüyle çalışır. Sistem yöneticisi
paneldeki Kullanıcılar bölümünden ek hesaplar oluşturabilir.

- `admin`: içerik düzenleme, yayınlama, kalıcı silme ve kullanıcı yönetimi.
- `editor`: içerik ve dinamik sayfa taslaklarını düzenleme. Yayınlama, kalıcı silme
  ve kullanıcı yönetimi yetkisi yoktur.

Panelden oluşturulan kullanıcılar `content/admin/users.json` içinde tutulur.
Parolaların kendisi kaydedilmez; rastgele salt ile üretilmiş `scrypt` özeti saklanır.
Rol, parola veya aktiflik değişikliğinde kullanıcının mevcut oturum sürümü geçersiz
hale gelir. Pasifleştirilen kullanıcı yeni isteklerinde giriş ekranına yönlendirilir.

Entegrasyon testleri gerçek kullanıcı dosyasına dokunmamak için başlattıkları izole
sunucu sürecinde `PANEL_USERS_FILE_PATH` değişkenini geçici bir dosyaya yönlendirir.
Normal çalışma ortamında bu değişken tanımlanmaz ve standart `content/admin/users.json`
yolu kullanılır.

## Kalıcı production veri dizini

Panelin JSON verileri tek bir merkezi yol çözümleyicisi üzerinden okunur ve yazılır.
`PANEL_DATA_ROOT` tanımlanmadığında geliştirme davranışı değişmez; `content` ve
`messages` klasörleri proje içinden kullanılmaya devam eder.

Production sunucusunda `PANEL_DATA_ROOT` mutlak bir dizin olarak tanımlandığında:

- `content` verileri `<PANEL_DATA_ROOT>/content` altında,
- dört dildeki çeviriler `<PANEL_DATA_ROOT>/messages` altında tutulur.

Örneğin `PANEL_DATA_ROOT=/var/lib/lago-panel` ayarı, sayfa verilerini
`/var/lib/lago-panel/content` ve çevirileri `/var/lib/lago-panel/messages` yoluna
yönlendirir. Göreceli yollar çalışma dizinine göre farklı sonuç üretebileceği için
bilinçli olarak reddedilir.

Bu ilk aşamada `public/uploads` taşınmaz. Dışarıdaki bir upload klasörü Next.js
tarafından kendiliğinden `/uploads/...` adresinde yayınlanmayacağı için önce Nginx
eşlemesi veya güvenli bir dosya sunma endpoint'i hazırlanmalıdır. Böylece kalıcı JSON
yapısını devreye alırken mevcut görsel URL'leri bozulmaz.

Kalıcı dizin ilk kez devreye alınmadan önce mevcut `content` ve `messages` klasörleri
aynı alt klasör yapısıyla hedefe kopyalanmalı, ardından sunucu kullanıcısına yalnızca
gereken okuma/yazma izinleri verilmelidir. Bu geçiş otomatik yapılmaz; yanlış veya boş
bir dizinin mevcut canlı içeriğin üzerine geçmesi engellenir.

İlk taşıma iki aşamalı komutla yapılır. Önce yalnızca kaynak, hedef, dosya sayısı ve
boyut kontrol edilir; bu komut hiçbir dosyaya yazmaz:

```bash
PANEL_DATA_ROOT=/var/lib/lago-panel npm run panel:data:prepare
```

Gösterilen plan doğrulandıktan sonra aynı işlem açık onay parametresiyle uygulanır:

```bash
PANEL_DATA_ROOT=/var/lib/lago-panel npm run panel:data:prepare -- --apply
```

Hazırlama aracı hedefin proje/release klasörü dışında olmasını ve boş olmasını zorunlu
tutar. Dosyaları önce hedefte benzersiz bir geçici klasöre kopyalar; her iki kaynak da
başarıyla kopyalandıktan sonra `content` ve `messages` adlarıyla yerlerine geçirir.
Mevcut hedef içeriğin üzerine yazmaz. Kopyalama doğrulandıktan sonra aynı
`PANEL_DATA_ROOT` değeri build ve çalışan sunucu sürecine kalıcı ortam değişkeni olarak
verilmelidir.

## Production session secret

Development ortamında hızlı yerel kurulum için dahili örnek secret kullanılabilir.
Production ortamında ise `ADMIN_SESSION_SECRET` zorunludur, en az 32 karakter olmalı
ve `change-me-before-production` örnek değerinden farklı olmalıdır. Bu koşullardan
biri sağlanmazsa sistem kapalı-güvenli davranır:

- Yeni session token üretilemez.
- Mevcut veya sahte session cookie'leri geçerli kabul edilmez.
- Panel sayfaları giriş ekranına yönlendirilir.
- Login API yapılandırma hatasını `503 Service Unavailable` ile bildirir.
- Public web sitesi çalışmaya devam eder.

Güvenli bir secret sunucuda aşağıdaki komutla üretilebilir:

```bash
openssl rand -base64 48
```

Üretilen değer yalnızca sunucu ortam değişkenlerine eklenmeli, kaynak koda veya Git
deposuna yazılmamalıdır. Secret değiştirildiğinde daha önce oluşturulmuş bütün panel
oturumları güvenli biçimde geçersiz olur ve kullanıcıların yeniden giriş yapması gerekir.

## Görsel yükleme formatları

Paneldeki görsel upload endpoint'i yalnızca JPG/JPEG, PNG, WEBP ve GIF dosya
uzantılarını kabul eder. SVG ve PDF görsel yükleme kapsamının dışında bırakılmıştır.
Frontend dosya seçicileri ile backend aynı merkezi format listesini kullanır; bu
nedenle arayüz filtresi aşılarak doğrudan API isteği gönderilse de SVG/PDF reddedilir.

Sunucu bir dosyayı kaydetmeden önce üç değerin aynı görsel formatını göstermesini
zorunlu tutar:

- Dosya uzantısı (`.jpg`, `.jpeg`, `.png`, `.webp` veya `.gif`)
- İstekte bildirilen MIME türü
- Dosyanın binary imzasından algılanan gerçek format

Bu nedenle örneğin bir SVG dosyasının adı `gorsel.jpg` olarak değiştirilse veya PNG
dosyası JPEG MIME türüyle gönderilse bile dosya diske yazılmadan reddedilir. Binary
imza kontrolü dosyanın tamamını yeniden kodlamaz; daha ileri içerik güvenliği için
ileride güvenilir bir görsel decoder ile açma ve yeniden kodlama katmanı eklenebilir.

## Çıkış istek sınırı

Çıkış endpoint'i IP başına dakikada 20 istekle sınırlandırılır. Arayüzde çıkış
başladıktan sonra buton devre dışı bırakılarak aynı kullanıcının art arda istek
göndermesi engellenir.

## Bellek ve ölçek sınırı

Sayaç deposu tek Node.js sürecinin belleğinde tutulur ve en fazla 5000 anahtar
saklar. Süresi dolmuş anahtarlar temizlenir; kapasite dolduğunda en eski anahtar
çıkarılır. Bu yapı tek sunucu örneği için uygundur.

Uygulama birden fazla process, container veya serverless instance üzerinde
çalıştırılacaksa sayaçların Redis gibi ortak ve atomik bir depoya taşınması gerekir.
Rate limiter arayüzü bu geçişin endpoint davranışlarını değiştirmeden yapılabilmesi
için ayrı bir modülde tutulur.

## Atomik JSON kayıtları

Panelin sayfa, mesaj, kullanıcı, galeri ve blog JSON dosyaları doğrudan hedef dosyanın
üzerine yazılmaz. Yeni içerik önce hedefle aynı klasörde, benzersiz isimli geçici bir
dosyaya tamamen yazılır. Yazma başarıyla tamamlandıktan sonra geçici dosya `rename`
ile hedef dosyanın yerine geçirilir.

Yazma veya değiştirme işlemi başarısız olursa geçici dosya temizlenir ve mevcut JSON
dosyası korunur. Böylece bir kayıt hatası sırasında yarım JSON bırakma riski azaltılır.

JSON yazmaları hedef dosya bazında kuyruğa alınır. Okuma-değiştirme-yazma yapan sayfa,
kullanıcı, çeviri, galeri ve blog işlemlerinde kuyruk bütün işlem boyunca tutulur.
Aynı içerik koleksiyonuna gelen ikinci işlem birincinin tamamlanmasını bekler; farklı
koleksiyonlar ise birbirini engellemeden çalışır. Başarısız bir işlem sonraki kayıtları
kilitlemez ve tamamlanan kuyruklar bellekten temizlenir.

Bu kuyruk tek Node.js süreci içinde çalışır. Uygulama birden fazla process veya sunucu
örneğinde çalıştırılırsa süreçler arası kilit ya da ortak bir veri tabanı gerekir.

## Dinamik sayfa çöp kutusu

Dinamik sayfalardaki silme işlemi kayıt dosyasını fiziksel olarak kaldırmaz. Sayfanın
değiştirilmemiş kayıt dosyası ile silinme zamanı ve işlemi yapan kullanıcı bilgisi
`<PANEL_DATA_ROOT>/trash/pages/<sayfa-id>/` altına taşınır. `PANEL_DATA_ROOT`
tanımlı değilse geliştirme ortamında proje kökündeki `trash` klasörü kullanılır ve bu
klasör Git tarafından takip edilmez.

Taşıma sırasında aynı sayfa kimliği için daha önce oluşturulmuş bir çöp kaydının
üzerine yazılmaz. Sayfa kaydı ile çöp kutusu aynı veri kökünde bulunduğu için aktif
kayıt atomik dosya taşıma işlemiyle korunur. Sayfanın kullandığı yüklenmiş görseller
bu işlem sırasında silinmez.

Çöp kutusundaki sayfa özetleri salt okunur API ile listelenebilir. Bu endpoint yalnızca
silme yetkisine sahip yöneticilere açıktır. Kaynak kaydı sağlam olup silinme meta verisi
eksik kalan bir girdi de veri kaybını gizlememek için listede tutulur.

Geri yükleme endpoint'i yalnızca silme yetkisine sahip yöneticilere açıktır ve aynı
origin kontrolü ile istek sınırı uygular. Geri yüklemeden önce aktif sayfa kimliği ve
bütün dillerdeki slug çakışmaları denetlenir. Çakışma varsa aktif veya silinmiş hiçbir
kayıt değiştirilmez. Yayında silinen bir sayfa da doğrudan tekrar yayınlanmaz; içeriği
korunarak taslak biçiminde geri yüklenir. Panel işlemden önce bu davranışı açıklayan
bir onay penceresi gösterir ve başarılı geri yüklemeden sonra aktif sayfa listesini
sunucudan yeniden okur.

Kalıcı silme endpoint'i de yalnızca silme yetkisine sahip yöneticilere açıktır; aynı
origin denetimi ve dakikada 10 istek sınırı uygular. İstek gövdesinde
`KALICI OLARAK SİL` ifadesi eksiksiz yer almadan işlem yapılmaz. Kalıcı silme yalnızca
sayfanın çöp kutusu kaydını kaldırır; sayfanın kullandığı yüklenmiş görsel dosyalarını
silmez.

## Çöp kutusu saklama ve otomatik temizlik

Çöp kutusu bakım aracı varsayılan olarak 90 günden eski dinamik sayfa kayıtlarını
temizleme adayı yapar, ancak silinme zamanından bağımsız olarak en yeni 20 geçerli
kaydı daima korur. İki değer sunucu ortamından değiştirilebilir:

- `PANEL_TRASH_RETENTION_DAYS`: Saklama süresi; varsayılan `90`, izin verilen aralık
  `1-3650` gündür.
- `PANEL_TRASH_MIN_ITEMS`: Her koşulda korunacak en yeni kayıt sayısı; varsayılan
  `20` değeridir ve `0` olarak da ayarlanabilir.

Eksik kaynak dosyası, geçersiz silinme tarihi veya kayıt kimliğiyle eşleşmeyen meta
veri bulunan girdiler otomatik olarak silinmez ve bakım çıktısında atlanan kayıt olarak
gösterilir. Böylece bozuk veya kısmen yazılmış bir kayıt veri kaybına dönüşmez.

Komut varsayılan olarak yalnızca planı gösterir ve hiçbir kaydı değiştirmez:

```bash
PANEL_DATA_ROOT=/var/lib/lago-panel npm run panel:trash:cleanup
```

Plan doğrulandıktan sonra gerçek temizlik açık `--apply` parametresiyle yapılır:

```bash
PANEL_DATA_ROOT=/var/lib/lago-panel npm run panel:trash:cleanup -- --apply
```

Otomatik çalıştırma uygulama sürecindeki zamanlayıcıya bağlanmaz. Node.js süreci
yeniden başlayabileceği veya birden fazla örnek çalışabileceği için komut sunucunun
cron/systemd zamanlayıcısından günde bir kez çağrılmalıdır. Örnek cron girdisindeki
proje yolu, Node/npm yolu ve log yolu sunucuya göre düzenlenmelidir:

```cron
15 3 * * * cd /srv/lago-panel/current/client && PANEL_DATA_ROOT=/var/lib/lago-panel PANEL_TRASH_RETENTION_DAYS=90 PANEL_TRASH_MIN_ITEMS=20 /usr/bin/npm run panel:trash:cleanup -- --apply >> /var/log/lago-panel-trash-cleanup.log 2>&1
```

Ortam değerleri değiştirildiğinde yeni politika bir sonraki çalışmada otomatik olarak
uygulanır; uygulamayı yeniden derlemek gerekmez. Aynı kalıcı `PANEL_DATA_ROOT` değeri
hem web uygulamasına hem bakım komutuna verilmelidir.

## Dinamik sayfa düzenleme kilidi

Kayıtlı bir dinamik sayfanın editörü açıldığında kullanıcı ve tarayıcı sekmesine özel,
90 saniyelik bir düzenleme kilidi alınır. İçerik kilit alındıktan sonra yüklenir. Editör
kilidi 30 saniyede bir heartbeat isteğiyle yeniler ve ekrandan çıkarken serbest bırakır.

Sayfa başka kullanıcıda kilitliyse içerik salt okunur açılır. Arayüz kilidi 15 saniyede
bir yeniden kontrol eder. Admin rolü açık bir onaydan sonra kilidi devralabilir; editor
rolü devralamaz. Her taslak kaydetme ve yayın durumu isteğinde kullanıcıya özel kilit
tokenı sunucuda yeniden doğrulanır. Sayfa başka biri tarafından düzenlenirken silme
isteği de reddedilir.

Kilitler geçici çalışma durumu olduğu için sunucu belleğinde tutulur ve yeniden başlatma
sırasında temizlenir. Birden fazla Node.js süreci kullanılırsa kilit deposunun Redis veya
ortak bir veri tabanına taşınması gerekir.

## Kaynaklar

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B Rate Limiting](https://pages.nist.gov/800-63-4/sp800-63b.html#rate-limiting-throttling)
