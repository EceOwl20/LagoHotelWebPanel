This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Azura anasayfa pilot bağlantısı

Panel girişinden sonra `/[locale]/panel/oteller` ekranında Lago veya Azura seçilir.
Otel bağlamı adreste görünür: Lago mevcut panel yollarını, Azura
`/[locale]/panel/azura/icerikler` altında anasayfa, oda sayfası ve ortak iletişim içeriklerini kullanır. Azura ekranında Lago içerik
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
