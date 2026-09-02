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

## Kaynaklar

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B Rate Limiting](https://pages.nist.gov/800-63-4/sp800-63b.html#rate-limiting-throttling)

