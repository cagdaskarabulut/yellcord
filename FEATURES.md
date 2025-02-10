# ✅ Yellcord Proje Planı

## 1. Temel Proje Yapısı ve Kurulum
- [X] Next.js 15 + Tailwind CSS + shadcn + PostgreSQL kullanarak MVP geliştirmeye başla.
- [X] PostgreSQL'i fetch ile çalıştır, Prisma vs kullanmadan düz veritabanı scriptleri ile geliştir.
- [X] Tüm tablo isimlendirmelerinde 'yellcord_' önekini kullan (Örn: `yellcord_users`).
- [X] Veritabanına yapılan tüm işlemleri `database.sql` dosyasına kaydet.
- [X] Ekran tasarımlarını desktop, mobil ve tablet için ayrı gruplandır.

## 2. Kullanıcı Kayıt ve Giriş
- [X] NextAuth.js ile kullanıcı giriş/kayıt işlemlerini yap.
- [X] Kullanıcılar kayıt olabilir, giriş yapabilir ve çıkış yapabilir.
- [X] Şifreleri bcrypt ile hash'le.
- [X] JWT veya NextAuth.js ile oturum yönetimi sağla.

## 3. Anasayfa ve Oda Yönetimi
- [X] Sol dar alanda kullanıcının kayıt olduğu odaların listesini göster.
- [X] Kullanıcılar yeni odalar oluşturabilir ve otomatik olarak kayıt olabilir.
- [X] Odalara isim ve logo eklenebilir.
- [X] Oda ID'si paylaşılabilir ve başka kullanıcılar bu ID ile kayıt olup giriş yapabilir.

## 4. Kullanıcı Profili
- [X] Sol üst köşeye kullanıcı profil resmi ekle.
- [X] Profile tıklanınca açılan popup içinde kullanıcı adı ve çıkış butonu olsun.

## 5. Sohbet Alanı (Metin + Ses + Görüntü)
- [X] Socket.io kullanarak mesajlaşma altyapısını kur.
- [X] Metin mesajları canlı olarak iletilsin.
- [X] Mesajlar PostgreSQL'de saklansın ve geri çağrılabilsin.
- [ ] Mesaj düzenleme ve silme özellikleri eklensin.
- [X] Kullanıcılar metin odasında mesaj gönderebilsin.

## 6. Sesli ve Görüntülü Görüşme (WebRTC)
- [ ] Kullanıcılar sesli/görüntülü sohbet başlatabilsin.
- [ ] Birden fazla kişi aynı anda bir kanalda konuşabilsin.
- [ ] WebRTC ile ses ve görüntü aktarımı sağla.
- [ ] Kullanıcı ayrıldığında bağlantıyı kes.

## 7. Ekran Paylaşımı (WebRTC)
- [ ] Kullanıcılar ekran paylaşabilsin.
- [ ] Belli bir pencere veya tüm ekran paylaşılabilsin.
- [ ] Bağlantı sonlandırıldığında paylaşım durdurulsun.
- [ ] Kanal içindeki kullanıcılar başkasının ekranını izleyebilsin.

## 8. Oda Katılımcı Listesi
- [X] Sağ tarafta odaya kayıtlı kullanıcıları listele.
- [X] Kullanıcı aktifse beyaz, pasifse gri font ile gösterilsin.
