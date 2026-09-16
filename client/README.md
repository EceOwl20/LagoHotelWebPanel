This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### Azura anasayfa pilot bağlantısı

Lago panelindeki `/tr/panel/azura/experience` ekranı yalnızca Azura'nın iki
tanıtım görselini, dört dilde alt metinlerini ve tanıtım yazılarını yönetir. Azura API adresi ve
servis tokenı yalnızca Lago sunucusunun ortam değişkenlerinde tanımlanmalıdır:

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
