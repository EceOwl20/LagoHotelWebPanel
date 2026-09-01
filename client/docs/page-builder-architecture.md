# Panel Sayfa Oluşturucu Mimarisi

## Durum

Kabul edildi — ilk araştırma ve mevcut proje envanteri, 1 Eylül 2026.

Bu belge, mevcut sayfaları panelden yönetilebilir hale getirirken kullanılacak içerik modelini tanımlar. Amaç, birbirine benzeyen her görünüm için ayrı bir veri tipi üretmeden mevcut tasarımları korumaktır.

## Araştırma özeti

İncelenen resmi kaynaklarda ortak yaklaşım şudur:

- Sayfa içeriği, farklı tiplerde nesneler içerebilen sıralanabilir bir block dizisi olarak saklanır.
- Her block kendi şemasına ve kalıcı bir tip kimliğine sahiptir.
- Aynı block farklı sayfalarda tekrar kullanılabilir; görsel farklılıklar kontrollü varyantlarla sınırlandırılır.
- Tekrarlanan kartlar ve görseller block içindeki sıralanabilir diziler olarak modellenir.
- Editöre sınırsız tasarım seçeneği vermek yerine marka tasarımını koruyan önceden tanımlı block ve varyantlar sunulur.
- Şema doğrulaması hem panelde hem sunucuda uygulanır.

Kaynaklar:

- [Payload Blocks Field](https://payloadcms.com/docs/fields/blocks)
- [Sanity structured content page builder](https://www.sanity.io/docs/developer-guides/how-to-use-structured-content-for-page-building)
- [Storyblok Blocks](https://www.storyblok.com/docs/concepts/blocks)
- [Storyblok content modeling](https://www.storyblok.com/docs/concepts/content-modeling)
- [Prismic Slices](https://prismic.io/features/slices)

## Mimari karar

Sayfa verisi `sections` isimli sıralanabilir bir block dizisi kullanacaktır. İçerik şekli ile React görünümü birbirinden ayrılacaktır.

```json
{
  "id": "section-id",
  "type": "cardCollection",
  "displayMode": "grid",
  "enabled": true,
  "translations": {
    "tr": {
      "eyebrow": "Odalar",
      "title": "Konaklama seçenekleri",
      "text": ""
    }
  },
  "cards": []
}
```

- `type`: Veri sözleşmesini belirler ve geriye dönük uyumluluk için kalıcıdır.
- `variant` veya block'a ait kontrollü görünüm alanı: Aynı veri sözleşmesinin onaylı görsel sunumlarından birini seçer.
- `enabled`: Bölümü silmeden geçici olarak gizler.
- `translations`: TR, EN, DE ve RU içeriklerini aynı block içinde tutar.
- `cards` veya `images`: Tekrarlanan içerikleri benzersiz kimlik ve sıra bilgisiyle saklar.

Tek bir büyük, koşullarla dolu component oluşturulmayacaktır. Renderer kayıt sistemi kullanılacaktır:

```text
type + variant
      ↓
renderer registry
      ↓
mevcut veya ortak React component'i
```

## İlk block kataloğu

| Block tipi | İçerik sözleşmesi | İlk varyantlar |
| --- | --- | --- |
| `hero` | Görsel/video, üst başlık, başlık, metin | `fullscreen`, `compact`, `dark` |
| `mediaText` | Görsel, başlık alanı, metin, bağlantı | `imageLeft`, `imageRight`, `overlay` |
| `imageCollection` | Başlık alanı, görsel listesi | `gallery`, `carousel`, `modalCarousel` |
| `cardCollection` | Başlık alanı; ortak görsel ve yerelleştirilmiş metin içeren kart listesi | `grid`, `carousel` |
| `featureList` | Başlık alanı, ikonlu özellik listesi | `inline`, `grid` |
| `backgroundFeature` | Arka plan medyası, metin, bağlantı | `parallax`, `static` |
| `richText` | Başlık ve yapılandırılmış metin | `centered`, `article` |
| `callToAction` | Arka plan, başlık, metin, buton | `image`, `plain` |

Yeni bir block tipi ancak veri sözleşmesi gerçekten farklıysa eklenecektir. Yalnızca boşluk, renk, hizalama veya görsel oranı değişiyorsa yeni `type` yerine kontrollü `variant` kullanılacaktır.

## Sayfa aileleri

Mevcut kod envanteri şu aileleri gösteriyor:

### Oda detayları

Yedi oda detay sayfası aynı ana akışı paylaşıyor:

```text
SubRoomBanner
SubroomCarousel
RoomFeatures / RoomFeatures2
BackgroundSection veya RoomsParallaxSection
RoomTour
OtherOptions
ContactSection2
```

Bunlar için `roomDetail` şablonu oluşturulacaktır. Disability Room gibi küçük farklar şablon varyantı veya izin verilen alternatif block ile karşılanacaktır.

### Restoran ve bar detayları

Restoran ve bar detaylarında şu yapı yoğun biçimde tekrar ediyor:

```text
Banner
ClinaryReverseInfo
KidsMomentCarousel
CuisinesCarousel
RoomTour
DiscoverBackground
OtherOptions
ContactSection2
```

Bunlar `venueDetail` şablonu altında birleştirilecektir. Restoran ve bar görsel farkları veri tipini çoğaltmadan varyantlarla korunacaktır.

### Spa, Sport ve About

Bu sayfalar `mediaText`, `imageCollection` ve `cardCollection` block'larını paylaşabilir. Mevcut Spa component'larının Sport ve About tarafından kullanılması bunu doğruluyor.

### Ana sayfa

Ana sayfa ayrı bir `home` şablonu olarak kalacaktır. Özel animasyon ve yerleşimleri ortaklaştırmak zorunda değildir; ancak metin, bağlantı ve medya alanlarında aynı alan tanımları ile medya seçiciyi kullanacaktır.

## Şablon ve özgürlük sınırı

Her sayfaya bütün block'lar açılmayacaktır. Şablon, kullanılabilecek block tiplerini ve başlangıç düzenini belirler:

- `standard`: Genel amaçlı dinamik sayfalar.
- `roomDetail`: Oda sayfaları.
- `venueDetail`: Restoran ve bar sayfaları.
- `experience`: Spa, Sport, Kids Club ve benzeri deneyim sayfaları.
- `home`: Ana sayfaya özel kontrollü block listesi.

Bu yaklaşım, Payload'ın koşullu block seçimi ve Storyblok'un izin verilen block listeleriyle aynı güvenlik ilkesini uygular.

## İçerik ve medya kuralları

- Panelden değiştirilen medya `/uploads` veya ileride kalıcı bir medya servisi üzerinden referanslanır.
- Logo, ikon ve salt tasarım varlıkları component kodunda kalır.
- Aynı medya birden fazla yerde kullanılabilir; dosya kopyalamak yerine aynı kaynak adresine referans verilir.
- Bir block veya karttan görsel çıkarmak fiziksel dosyayı silmez.
- Yerelleştirilmiş metin ve `alt` alanları block veya item seviyesinde tutulur.
- Paylaşılması gerekmeyen içerik block içine gömülür. Birden fazla sayfada gerçekten ortak yönetilecek içerik için ayrı referans kullanılır.

## Geçiş planı

1. Block kayıt sistemi, ortak alan şeması ve sunucu doğrulamasını oluştur.
2. Mevcut dinamik sayfa builder'ını yeni kayıt sistemine geriye uyumlu bağla.
3. `roomDetail` şablonunu oluştur ve tek bir oda sayfasında pilot uygula.
4. Görsel ve davranış eşitliğini doğruladıktan sonra diğer oda sayfalarını veri migrasyonuyla taşı.
5. `venueDetail` şablonunu bir restoran sayfasında pilotla.
6. Spa/Sport/About ailesini ortak block sözleşmelerine geçir.
7. Ana sayfayı en son, özel varyantları korunarak bağla.

Her migrasyon adımında resmi örnekler yeniden kontrol edilecek; şema testi, mevcut URL testi, dört dil kontrolü ve production build zorunlu olacaktır.

## İlk teknik uygulama durumu

Dinamik `standard` sayfalar için şu altyapı tamamlandı:

- Merkezi `blockDefinitions` kaydı.
- Block başına alan, varyant ve doğrulama tanımları.
- Merkezi `sectionRenderer` eşlemesi.
- `intro`, `imageText`, `gallery`, `carousel`, `callToAction` ve `cardCollection` block'ları.
- `cardCollection` içinde sıralanabilir kartlar ve `grid` / `carousel` görünüm seçimi.

Bu altyapı doğrulanmadan mevcut oda, restoran veya ana sayfa verileri taşınmayacaktır.
