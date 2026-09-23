This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### İki otelli içerik paneli

Panel girişinden sonra `/[locale]/panel/oteller` ekranında Lago veya Azura seçilir.
Otel bağlamı adreste görünür: Lago mevcut panel yollarını, Azura
`/[locale]/panel/azura/icerikler` altında anasayfa, oda, restoran ve ortak iletişim içeriklerini kullanır. Azura ekranında Lago içerik
menüleri ve Lago taslak bildirimleri gösterilmez. Bu seçim erişim yetkisi
değildir; kullanıcı rolleri ve API izin kontrolleri mevcut şekilde uygulanır.

Azura "Sayfa İçerikleri" ekranı karşılama, beş kartlı keşif kaydırıcısı, animasyonlu tanıtım ve altı maddeli
olanaklar bölümlerini tek anasayfa altında toplar. Bölümler ayrı revision'larla
kaydedilir. Eski `/[locale]/panel/azura/welcome` ve
`/[locale]/panel/azura/experience` pilot adresleri doğrulama süresince
erişilebilir kalır.

Lago panelindeki `/tr/panel/azura/experience` ekranı yalnızca Azura'nın iki
tanıtım görselini, dört dilde alt metinlerini ve tanıtım yazılarını yönetir.

`/tr/panel/azura/welcome` ekranı videonun altındaki karşılama bölümünün dört dilde
üst başlığını, ana başlığını, paragrafını ve düğme metnini ayrı olarak yönetir.
Lago sunucusu mevcut `AZURA_EXPERIENCE_API_URL` adresinden Azura'nın
`/api/azura/homepage/welcome/text` adresini türetir; ek ortam değişkeni gerekmez.
Bu uç da revision/`If-Match` ile eski sekmenin kaydını `409` olarak reddeder.

Olanaklar bölümü Lago'da `/api/admin/azura/homepage/sections/essentials`
üzerinden Azura'nın aynı bölüm API'sine bağlanır. Servis URL'si mevcut
`AZURA_EXPERIENCE_API_URL` değişkeninden türetilir. Bölüm izin listesinde
`essentials` ve `carousel` vardır; olanaklar yazması dört dildeki 15 alanı ve
revision'ı doğrular.

Keşif kaydırıcısı aynı bölüm API'sinin `carousel` anahtarını kullanır. Beş
kartın sırası ve bağlantıları sabittir; görsel, dört dilde başlık ve alt açıklama
panelden düzenlenir. Lago'nun `/api/admin/azura/homepage/images` adresi Azura'nın
genel `/api/azura/homepage/images` adresine bağlanır. Eski experience medya
adresi uyumluluk için çalışmaya devam eder. Yükleme görseli yalnızca seçer;
yayınlamak için kaydırıcı bölümü ayrıca kaydedilmelidir.

Her iki otelin **Sayfa İçerikleri → Odalar** formu aynı metin ve medya alan
bileşenlerini kullanır. Lago'nun altı, Azura'nın üç sabit oda kartı gösterilir;
otel verileri birbirinden ayrı kalır. Azura formu banner, giriş, üç kart ve
parallax metinleri ile hero/kart/parallax görsellerini tek revision ile
`/api/admin/azura/rooms/page-content` üzerinden kaydeder. Proxy, Azura'nın
`GET/PUT /api/azura/rooms/page-content` adresine Bearer tokenı ve `If-Match`
ile bağlanır. `409` durumunda taslak korunur. Görsel listeleme/yükleme
`/api/admin/azura/rooms/images` üzerinden sürer; yükleme tek başına sayfayı
yayınlamaz. Eski kart API'si Azura'da uyumluluk için kalır, yeni form onu
kullanmaz. Lago mevcut yerel mesaj ve site-pages API'lerine, içerik düzenleme
kilidiyle yazmaya devam eder. Metin ve medya iki ayrı yerel dosya olduğundan
Lago kaydı kısmen başarılı olursa panel bunu bildirir ve kalan taslağı tutar.
Azura bağlantı adresi mevcut `AZURA_EXPERIENCE_API_URL` kaynağından türetilir;
ek Lago ortam değişkeni gerekmez.

Her iki otelin **Sayfa İçerikleri → Restoranlar** formu aynı metin ve görsel
alan bileşenlerini kullanır. Lago'nun mevcut yerel `Restaurants` mesajları ve
`restaurants` medya JSON'u içerik kilidiyle kaydedilir; iki yerel kayıt
adımından biri başarısız olursa kalan taslak korunur. Azura'nın yedi bölümü,
iki sabit üçlü kart grubu ve 13 görseli `/api/admin/azura/restaurants/page-content`
üzerinden tek revision ile kaydedilir. Bu adres, Azura'nın
`GET/PUT /api/azura/restaurants/page-content` API'sine Bearer tokenı ve
`If-Match` ile bağlanır; `409` durumunda taslak kaybolmaz. Görseller
`/api/admin/azura/restaurants/images` üzerinden listelenir ve yüklenir;
seçimde gerçek genişlik ve yükseklik de medya verisine yazılır. Görsel yükleme
tek başına sayfayı yayınlamaz. Bağlantı adresi mevcut
`AZURA_EXPERIENCE_API_URL` kaynağından türetilir; ek ortam değişkeni gerekmez.

Her iki otelin **Sayfa İçerikleri → Hakkımızda** ekranı `AboutPageFields` ve
`AboutMediaEditor` formunu kullanır. Lago'nun belge görseli, keşif kartları ve
galeri ekleme/çıkarma/sıralama işlevleri korunur. Azura'da yalnızca banner,
konum, dört sabit galeri görseli ve misyon/vizyon gösterilir (toplam sekiz
görsel). Üstteki kaydet düğmesi seçili otelin dört dilini ve medyasını kaydeder.
Lago mevcut yerel About mesaj/medya API'lerini ve düzenleme kilidini kullanır;
iki dosya ayrı kaydedildiğinden kısmi başarı hata mesajında belirtilir.
Azura'nın `/api/admin/azura/about/page-content` proxy'si `GET/PUT
/api/azura/about/page-content` adresine servis tokenı ve tırnaklı `If-Match`
ile bağlanır. Başarılı kayıttan sonra GET ile yeniden okunur; çakışmada taslak
korunur. `/api/admin/azura/about/images` görsel listesini ve tek dosyalı
yüklemeyi iletir. Seçimde gerçek ölçüler de kaydedilir; yükleme tek başına
sayfayı yayınlamaz. Ek ortam değişkeni gerekmez. İçerik gövdesi 128 KiB,
görsel JPEG/PNG/WebP ve en fazla 8 MiB/16 milyon piksel ile sınırlıdır.

Her iki otelin **Sayfa İçerikleri → Spa & Wellness** ekranı `SpaPageFields`
ve mevcut `SpaWellnessMediaEditor` formunu kullanır. Lago'nun `Spa` mesajları,
`spawellness` medyası ve koleksiyon ekleme/çıkarma/sıralama davranışı korunur.
Azura'da beş sabit galeri, dört sabit masaj kartı ve beş tekil görsel alanı
vardır. Masaj başlıkları ve görselleri aynı sabit kimlikle eşleşir. Üstteki
tek kaydet düğmesi dört dili ve medyayı kaydeder. Lago iki yerel API'yi
düzenleme kilidiyle kullanır; kısmi kayıt halinde kalan taslak korunur.
Azura `/api/admin/azura/spawellness/page-content` üzerinden kendi
`GET/PUT /api/azura/spawellness/page-content` API'sine bağlanır; sunucuda
Bearer tokenı ve tırnaklı `If-Match` eklenir. Kayıt sonrası GET ile doğrulama
yapılır, `409` durumunda taslak tutulur. Görsel listeleme ve yükleme
`/api/admin/azura/spawellness/images` üzerinden yapılır; seçimde gerçek
ölçüler kaydedilir. İçerik sınırı 128 KiB, görsel sınırı JPEG/PNG/WebP için
8 MiB ve 16 milyon pikseldir. Mevcut Azura ortam değişkenleri kullanılır.

**Oda detayları** `RoomDetailPageFields` formunu ve oda yapılandırmalarını
paylaşır. Lago'nun mevcut yedi oda detayının metinleri ve oda medyası üstteki
tek düğmeyle, mevcut düzenleme kilidi üzerinden kaydedilir. Parallax ve üç
öneri görseli mevcut `RoomsParallax` / Ortak Oda Alanları ekranında kalır;
Lago'nun sabit tur URL'leri değiştirilmez. Her oda yerel mesaj ve medya API'sini
kullanır; kısmi kayıtta hata gösterilir ve kalan taslak korunur.

Azura'da ilk etkin oda `deluxe` olup Odalar → Deluxe Oda altında bulunur.
`/api/admin/azura/room-details/[roomKey]/page-content` yalnızca izin listesindeki
odaları kabul eder; Deluxe, Family ve Fantasy yönetim bağlantıları etkindir.
GET `{bundle:{translations,tours},media,revision}` döndürür. Panel PUT'ta
revision'ı gönderir; sunucu bunu tırnaklı `If-Match` başlığına taşır ve yalnızca
`{bundle,media}` gövdesini Azura'ya iletir. Dört dil, dokuz galeri görseli,
üç Kuula turu ve Family → Fantasy sırasındaki iki öneri korunur. Background
alanı vardır; parallax alanı yoktur. Kayıt GET ile yeniden doğrulanır;
`409` taslağı silmez. Token yalnızca Lago sunucusunda kullanılır.

`/api/admin/azura/room-details/[roomKey]/images` listeleme/yükleme proxy'sidir.
Deluxe yüklemeleri `/uploads/pages/deluxeroom/` altında yapılır. Listelenen
`/uploads/pages/room-options/` görselleri yalnızca öneri alanlarında seçilebilir;
kapak, galeri ve background seçicilerinde gösterilmez. Ortak dizine yükleme
yanıtı reddedilir. Yeni yükleme, içerik kaydedilene kadar sayfayı değiştirmez.
İçerik 128 KiB, düz metinler 4000, alt metinler 300, tur URL'leri 1500 karakter;
JPEG/PNG/WebP görseller 8 MiB ve 16 milyon piksel ile sınırlandırılır.
Mevcut Azura ortam değişkenleri kullanılır, ek değişken gerekmez.

Azura API adresi ve servis tokenı yalnızca Lago sunucusunun ortam
değişkenlerinde tanımlanmalıdır:

```env
AZURA_EXPERIENCE_API_URL=http://localhost:3000/api/azura/homepage/experience
AZURA_SERVICE_TOKEN=<Azura sunucusundaki servis tokenı ile aynı değer>
```

Yerel portu Azura sunucusunun gerçekten dinlediği porta göre ayarlayın. Metin API
adresi bu URL'ye `/text` eklenerek otomatik türetilir; ayrı ortam değişkeni gerekmez.
Canlı bağlantıda HTTPS API adresi kullanın. Servis tokenını `NEXT_PUBLIC_`
değişkenine veya kaynak koduna koymayın. Görsel listesi ve yükleme API adresi
bu URL'ye `/images` eklenerek otomatik türetilir. Lago paneli JPEG, PNG ve WebP
görsellerini Azura'nın kalıcı uploads dizinine yükler (en fazla 8 MiB). Yükleme
görseli yalnızca seçer; anasayfada yayınlamak için görsel alanını ayrıca kaydedin.
Azura GET yanıtı `revision` (64 karakterlik küçük harf SHA-256 hex) döndürdüğünde
panel bunu görsel ve metin alanları için ayrı saklar; kayıtta Azura'ya
`If-Match: "<revision>"` gönderir. Eski API yanıtında `revision` yoksa pilot
geçici olarak sürümsüz çalışmaya devam eder. Azura `409` döndürürse panel eski
veriyle kaydetmez ve kullanıcıya değişikliklerini koruyarak yenilemesini söyler.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Azura Family oda detayı

Family, Deluxe ile aynı `AzuraRoomDetailEditor` ve Lago ile aynı
`RoomDetailPageFields` formunu kullanır. Oda farklılıkları
`lib/admin/room-detail-model.mjs` içinde tanımlıdır: 12 galeri, iki tur
(`land`, `sea`), iki öneri (`deluxe`, `fantasy`) ve arka planda `list1/list2`.
Parallax eklenmez. Odalar arasında geçiş taslakları korur; üstteki kayıt
düğmesi yalnızca seçili odanın dört dilini ve medyasını kaydeder.

Mevcut dinamik panel proxy rotaları Family için de kullanılır:
`/api/admin/azura/room-details/family/page-content` ve `/images`.
Sunucu mevcut `AZURA_EXPERIENCE_API_URL` üzerinden Azura adresini türetir;
`AZURA_SERVICE_TOKEN` yalnızca sunucuda kullanılır. Yeni ortam değişkeni gerekmez.
İçerik PUT isteğinde revision, Azura'ya tırnaklı `If-Match` olarak aktarılır.
409 hatası taslağı silmez. Medya yüklemeleri yalnızca `familyroom` dizinine;
ortak `room-options` görsellerinin seçimi yalnızca öneri alanlarına izinlidir.
Deluxe özel medya dizini Family'de kullanılamaz.

### Azura Fantasy oda detayı

Fantasy de aynı oda editörü, dinamik panel proxy rotaları ve üst kayıt
düğmesiyle yönetilir. Ayrı form veya route kopyası yoktur. Oda yapılandırması
11 galeri görselini, tek `sea` turunu, `deluxe → family` önerilerini ve
`couples/kingBed/jacuzziTerrace` olanak alanlarını tanımlar. Arka planda
`list1/list2` korunur; parallax eklenmez. Deluxe/Family olanakları değişmez.

`/api/admin/azura/room-details/fantasy/page-content` mevcut servis bağlantısıyla
Azura'nın aynı adlı içerik API'sine gider; revision tırnaklı `If-Match` olarak
aktarılır. `/images` yüklemeleri yalnızca `/uploads/pages/fantasyroom/` içindir.
Ortak `room-options` dosyaları yalnızca öneri alanlarında seçilir; diğer
odaların özel dizinleri kabul edilmez. Yeni ortam değişkeni gerekmez.
Menü, oda ref'leri ve taslak durumu yapılandırmadan üretilir; kaydetme yalnızca
seçili odayı etkiler. Bilinmeyen oda kimlikleri kapalı kalır.
# Azura Spor içerik yönetimi

Spor, mevcut `AzuraSpaEditor`, `SpaPageFields` ve `SpaWellnessMediaEditor`
bileşenlerini `pageKey="spor"` ile kullanır. Ayrı form kopyası yoktur.
Azura Spor'da dört liste maddesi, üç sabit galeri öğesi ve toplam sekiz medya
alanı vardır; masaj bölümü gösterilmez ve API doğrulamasında kabul edilmez.
`types.fitness` ve `types.personalTrainer` alanları Spor'a özeldir.
Lago Spa ve Azura Spa varsayılan yapılarını korur.

Panel endpoint'leri:
- GET/PUT `/api/admin/azura/spor/page-content`
- GET/POST `/api/admin/azura/spor/images`

Spa/Spor içerik route'ları ortak `azura-spa-page-route.js` yardımcılarını
kullanır: oturum, içerik yetkisi, aynı kaynak kontrolü, hız ve 128 KiB gövde
sınırı korunur. Servis tokenı tarayıcıya gönderilmez. Mevcut
`AZURA_EXPERIENCE_API_URL` ve `AZURA_SERVICE_TOKEN` yeterlidir.
İçerik revision'ı Azura'ya tırnaklı If-Match ile aktarılır; 409 taslağı silmez.
Spor/Spa taslakları ayrı tutulur ve üst kayıt düğmesi seçili sayfayı kaydeder.

Spor görselleri yalnızca `/uploads/pages/spor/` içinden seçilir; gerçek ölçüler
korunur. 8 MiB ve 16 milyon piksel sınırı geçerlidir. Küçültülmüş
`treadmills-4800x3200.jpg` bu sınıra uygundur; dosyaya özel istisna yoktur.
