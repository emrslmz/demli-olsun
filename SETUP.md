# Demli Olsun — Kurulum ve Yayın Rehberi

Bu dosya, kodun dışında **senin** yapman gereken adımları sırasıyla anlatır: geliştirme ortamı, ilk çalıştırma, mağaza ürünleri, RevenueCat, AdMob, gizlilik, mağaza formları, test ve yayın.

> Mağaza panellerinin menü adları sık değişir. Aşağıdaki yollar yazıldığı tarihteki adlardır; bulamazsan panelin arama kutusuna ürün adını (ör. "In-App Purchases", "app-ads.txt") yaz.

---

## 1. Gereksinimler

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | 22 LTS (`.nvmrc`) | `nvm use` |
| npm | Node ile gelen | |
| Android Studio | Güncel kararlı sürüm | Android SDK Platform 35+ ve Build Tools; JDK 21 (Android Studio ile gelir) |
| Xcode | Capacitor 8'in istediği güncel sürüm | Yalnızca macOS. iOS bağımlılıkları Swift Package Manager ile gelir (CocoaPods yok) |
| Apple Developer hesabı | Ücretli | Cihazda test, IAP ve yayın için |
| Google Play Console hesabı | | |

Güncel Capacitor ortam gereksinimleri: <https://capacitorjs.com/docs/getting-started/environment-setup>

## 2. Projeyi çalıştırma (tarayıcı)

```bash
npm ci
cp .env.example .env        # değerleri sonra dolduracaksın; boşken her şey test/mock modda çalışır
npm run dev                 # http://localhost:5173 — telefon görünümü için tarayıcıda cihaz modunu aç
```

Tarayıcıda reklamlar ve satın almalar **sahte (mock)** servislerle çalışır. Ana menüde logoya **5 kez dokununca** geliştirici menüsü açılır: bahşiş ekleme, aşama/gösterge seçimi, sahte reklam (başarı/iptal/yüklenemedi) ve satın alma (başarı/iptal/hata/fiyat yok) senaryoları, saat kaydırma (günlük sipariş, lig haftası), tema değiştirme, debug katmanı ve çapa düzenleyici.

Faydalı komutlar:

| Komut | Ne yapar |
|---|---|
| `npm run check` | Tip denetimi + lint + biçim + testler + derleme (ilk hatada durur) |
| `npm test` | Vitest birim testleri |
| `npm run build` | Release web paketi (`dist/`), gerçek reklam kimlikleri `.env`'den |
| `npm run build:debug` | Debug web paketi: **daima Google test reklam kimlikleri**, geliştirici menüsü açık |
| `npm run cap:sync` / `cap:sync:debug` | Web paketini derleyip native projelere kopyalar |
| `npm run art` | Tüm görselleri koddan yeniden üretir (`tools/art/`) |
| `npm run cap:assets` | `assets/` içindeki ikon/splash'ten native ikonları üretir |

## 3. Paket kimliği (bundle id)

Şu an `com.demliolsun.app`. Kendi şirket adınla değiştirmek için (ör. `com.sirketin.demliolsun`) **ilk mağaza yüklemesinden önce** şu dört yeri birlikte değiştir:

1. `capacitor.config.ts` → `appId`
2. `android/app/build.gradle` → `namespace` ve `applicationId`
3. `android/app/src/main/java/com/demliolsun/app/MainActivity.java` → dosyayı yeni pakete uygun klasöre taşı ve ilk satırdaki `package` ifadesini güncelle
4. Xcode → App hedefi → **Signing & Capabilities** → Bundle Identifier

Sonra `npx cap sync`.

## 4. İlk çalıştırma (cihazda)

### Android

```bash
npm run cap:sync:debug
npx cap open android
```

Android Studio açılınca Gradle senkronizasyonunu bekle, bir cihaz/emülatör seç ve ▶ Run. Hem **hareketle gezinme** hem **3 tuşlu gezinme** ile dene (Ayarlar → Sistem → Gezinme). Uygulama dikeyde kilitlidir; Android 15+ cihazlarda kenardan kenara çizim ve çentik/gezinme çubuğu boşlukları otomatik uygulanır.

### iOS

```bash
npm run cap:sync:debug
npx cap open ios
```

Xcode'da App hedefi → **Signing & Capabilities**: Team'ini seç, **+ Capability → In-App Purchase** ekle. Bir iPhone seçip ▶ Run. iPad'de de dene: `UIRequiresFullScreen = YES` olduğu için uygulama dikeyde kalır.

## 5. Uygulama içi satın alma ürünleri

Ürün kimlikleri koddaki (`src/config/products.ts`) kimliklerle **birebir aynı** olmalı:

| Kimlik | Tür (App Store / Play) | İçerik | Önerilen fiyat |
|---|---|---|---|
| `remove_ads` | Non-Consumable / Tek seferlik | Geçiş + banner reklamlarını kaldırır | ₺129,99 civarı |
| `starter_pack` | Non-Consumable / Tek seferlik | 1500 bahşiş + Başlangıç bardağı + her güçlendiriciden 3 | ₺59,99 civarı |
| `theme_rize` | Non-Consumable / Tek seferlik | Rize çay bahçesi mekanı | ₺49,99 civarı |
| `theme_bogaz` | Non-Consumable / Tek seferlik | Boğaz vapuru mekanı | ₺49,99 civarı |
| `bahsis_s` | Consumable / Tüketilebilir | 500 bahşiş | ₺29,99 civarı |
| `bahsis_m` | Consumable / Tüketilebilir | 1500 bahşiş | ₺69,99 civarı |
| `bahsis_l` | Consumable / Tüketilebilir | 4000 bahşiş | ₺149,99 civarı |

Fiyatlar kodda yazmaz; oyun mağazanın yerelleştirilmiş fiyat metnini gösterir. Fiyat gelmezse buton "Fiyat yüklenemedi" yazar ve kapanır.

### App Store Connect

1. **Agreements, Tax, and Banking** → Paid Apps sözleşmesini imzala, banka ve vergi bilgilerini gir (yoksa ürünler sandbox'ta bile gelmez).
2. Uygulamayı oluştur (bundle id ile).
3. Uygulama → **Monetization → In-App Purchases** → her ürün için **+**: tür, *Reference Name*, *Product ID* (tablodaki kimlik), fiyat, Türkçe görünen ad/açıklama ve inceleme ekran görüntüsü.
4. İlk sürümü incelemeye gönderirken ürünleri sürüme ekle.

### Google Play Console

1. Uygulamayı oluştur. Ürün oluşturabilmek için önce **BILLING izinli bir AAB** yüklemen gerekir: `npm run cap:sync` → Android Studio → **Build → Generate Signed App Bundle** → **Test ve yayınla → Dahili test** kanalına yükle.
2. **Para kazanma → Ürünler → Uygulama içi ürünler** (tek seferlik ürünler) → tablodaki kimliklerle 7 ürünü oluştur ve **etkinleştir**. Tüketilebilir/tüketilemez ayrımı RevenueCat tarafında ve kodda yapılır.
3. **Para kazanma kurulumu** → ödeme profili.

## 6. RevenueCat

1. <https://app.revenuecat.com> → yeni proje.
2. **Apps**: bir App Store uygulaması ve bir Play Store uygulaması ekle.
   - iOS: App Store Connect'te **Users and Access → Integrations → In-App Purchase** anahtarı (.p8) oluşturup RevenueCat'e yükle (StoreKit 2 için önerilen yol).
   - Android: Google Cloud'da bir servis hesabı oluştur, Play Console'da **Kullanıcılar ve izinler** altında finans/sipariş izinleri ver, JSON anahtarını RevenueCat'e yükle. (İzinlerin etkinleşmesi birkaç saat sürebilir.)
3. **Products**: mağazalardaki 7 ürünü içe aktar.
4. **Entitlements** (kimlikler koddakiyle aynı olmalı):
   - `no_ads` → `remove_ads`
   - `starter_pack` → `starter_pack`
   - `theme_rize` → `theme_rize`
   - `theme_bogaz` → `theme_bogaz`
   - `bahsis_*` ürünleri hiçbir entitlement'a bağlanmaz (tüketilebilir; bahşiş işlem kimliğiyle bir kez eklenir).
5. **Offerings**: `default` adında bir offering oluşturup ürünleri paket olarak ekle (kod ürünleri kimlikle çeker; offering panel raporları ve ileride fiyat deneyleri için).
6. **Project settings → API keys** → uygulamaya özel **public** SDK anahtarlarını `.env`'e yaz:

```
VITE_REVENUECAT_KEY_IOS=appl_xxxxxxxxxxxxxxxx
VITE_REVENUECAT_KEY_ANDROID=goog_xxxxxxxxxxxxxxxx
```

> **Asla** `sk_` ile başlayan gizli anahtarı `.env`'e ya da koda koyma. `VITE_` ile başlayan her değer uygulama paketine gömülür.

## 7. AdMob

1. <https://admob.google.com> → **Uygulamalar → Uygulama ekle**: bir Android, bir iOS uygulaması (mağazada yayınlanmadıysa "henüz yayınlanmadı" seç, sonra mağazaya bağla).
2. **Uygulama kimliği** (`ca-app-pub-XXXX~YYYY`):
   - Android: `android/gradle.properties` dosyasına `ADMOB_APP_ID=ca-app-pub-XXXX~YYYY` satırını ekle (yoksa Google test kimliği kullanılır).
   - iOS: `ios/App/App/Info.plist` → `GADApplicationIdentifier` değerini gerçek kimlikle değiştir (şu an Google test kimliği).
3. Her platform için 3 **reklam birimi** oluştur ve `.env`'e yaz:
   - Ödüllü (devam, bahşiş ×2, bedava güçlendirici) → `VITE_ADMOB_REWARDED_*`
   - Geçiş (yalnızca Oyun Sonu → Tekrar/Menü) → `VITE_ADMOB_INTERSTITIAL_*`
   - Banner (uyarlanabilir; yalnızca Ana Menü ve Liderlik) → `VITE_ADMOB_BANNER_*`
4. Gerçek kimlikler **yalnızca** `npm run build` / `npm run cap:sync` (mode=production) ile kullanılır. `npm run dev` ve `npm run build:debug` daima Google'ın resmi test kimliklerini kullanır.
5. **Test cihazı**: AdMob → **Ayarlar → Test cihazları → Test cihazı ekle** (reklam kimliğini cihazdan al). Gerçek kimliklerle kendi reklamına tıklama — hesap kapatılabilir.
6. **Gizlilik ve mesajlaşma**:
   - **GDPR/UMP mesajı** oluştur, gizlilik politikası URL'ni bağla ve yayınla. Oyun ilk açılışta, eğitimden sonra bu formu gösterir; Ayarlar'daki "Reklam tercihleri" formu yeniden açar.
   - (İsteğe bağlı) **iOS IDFA açıklama mesajı**. Oyun sırası: UMP → App Tracking Transparency → AdMob başlatma.
   - Kişiselleştirme reddedilirse SDK otomatik olarak kişiselleştirilmemiş reklam gösterir.

## 8. app-ads.txt

1. AdMob → **Uygulamalar → Tüm uygulamaları göster → app-ads.txt** sekmesindeki satırı kopyala. Biçimi:
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
2. Bu satırı içeren `app-ads.txt` dosyasını, mağaza kayıtlarında **geliştirici web sitesi** olarak verdiğin alan adının **kök dizinine** koy: `https://alanadin.com/app-ads.txt` (alt klasör olmaz, düz metin).
3. Play Console ve App Store Connect'teki geliştirici web sitesi alanına aynı alan adını yaz. AdMob'un dosyayı taraması 24 saate kadar sürebilir.

## 9. Gizlilik politikası (KVKK)

Bir web sayfasında yayınla ve URL'yi `.env`'e (`VITE_PRIVACY_URL`), Play Console'a ve App Store Connect'e gir. Türkçe hazırla; KVKK (6698) aydınlatma yükümlülüğü için en az şunları içersin:

- **Veri sorumlusu**: adın/şirket unvanın, adres, iletişim e-postası.
- **Cihazda kalan veriler**: takma ad, oyun ilerlemesi, bahşiş, envanter, ayarlar. Bunlar yalnızca cihazda saklanır, sunucuya gönderilmez. (Liderlik şu an simülasyondur; gerçek backend eklenirse bu madde güncellenmeli.)
- **Reklam (Google AdMob)**: reklam kimliği (Android Advertising ID / iOS IDFA — yalnızca izin verilirse), IP adresi ve buna dayalı yaklaşık konum, cihaz bilgisi, reklam etkileşimleri. Amaç: reklam gösterimi, ölçüm, sahtekârlık önleme; kişiselleştirme yalnızca açık rızayla.
- **Satın alma (Apple / Google / RevenueCat)**: satın alma geçmişi ve anonim kullanıcı kimliği. Ödeme bilgilerini oyun görmez. Amaç: sözleşmenin ifası (satın alınanı vermek, geri yüklemek).
- **Hukuki sebepler**: açık rıza (kişiselleştirilmiş reklam), sözleşmenin kurulması/ifası (satın alma), meşru menfaat (güvenlik, sahtekârlık önleme).
- **Yurt dışına aktarım**: Google ve RevenueCat sunucuları yurt dışındadır; aktarımın dayanağını belirt.
- **Saklama süresi**, **KVKK md. 11 kapsamındaki hakların** ve başvuru yolu.
- **Rızayı geri alma**: Ayarlar → "Reklam tercihleri"; iOS'ta Ayarlar → Gizlilik → İzlenme. Cihazdaki veriler Ayarlar → "Kaydı sıfırla" ile silinir.
- **Çocuklar**: oyunun 13 yaş altını hedeflemediği (bkz. Bölüm 11).

Hukuki metin için bir avukattan ya da KVKK'ya uygun bir şablon hizmetinden destek almanı öneririm.

## 10. Mağaza gizlilik formları

### Google Play — Veri güvenliği

Uygulamanın kendisi sunucuya veri göndermez; beyanlar SDK'lardan gelir. Google'ın güncel AdMob beyan rehberini de kontrol et: <https://developers.google.com/admob/android/privacy/play-data-disclosure>

| Veri türü | Toplanıyor | Paylaşılıyor | Amaç | Not |
|---|---|---|---|---|
| Cihaz veya diğer kimlikler (reklam kimliği) | Evet | Evet (Google) | Reklam, analiz, sahtekârlık önleme | AdMob |
| Yaklaşık konum (IP'den) | Evet | Evet (Google) | Reklam | AdMob |
| Uygulama etkileşimleri / teşhis | Evet | Evet (Google) | Reklam, analiz | AdMob |
| Satın alma geçmişi | Evet | Hayır | Uygulama işlevi | Google Play / RevenueCat |

- Veriler aktarım sırasında şifrelenir: **Evet**.
- Veri silme talebi: cihazdaki veriler uygulama içinden silinebilir (Kaydı sıfırla).
- **Reklam içeriyor**: Evet. **Reklam kimliği** beyanı: Evet (AD_ID izni var).

### App Store — App Privacy

- **Data Used to Track You**: Device ID (yalnızca kullanıcı ATT izni verirse; AdMob).
- **Data Linked to You**: Purchases (satın alma geçmişi; uygulama işlevi).
- **Data Not Linked to You**: Coarse Location, Product Interaction, Advertising Data, Diagnostics (AdMob; üçüncü taraf reklam ve analiz).
- `ITSAppUsesNonExemptEncryption = NO` zaten `Info.plist`'te.

## 11. İçerik derecelendirmesi ve hedef kitle

- **Play → İçerik derecelendirmesi (IARC anketi)**: şiddet, korku, kumar yok; uygulama içi satın alma ve reklam **var**; kullanıcılar arası iletişim yok. Beklenen sonuç: PEGI 3 / Herkes.
- **Hedef kitle**: **13 yaş ve üstü** seç. 13 yaş altını hedeflersen Google **Aileler politikası** devreye girer: yalnızca Aileler için onaylı reklam SDK'ları, çocuklara yönelik işaretleme, kişiselleştirilmiş reklam yok, ek inceleme. Bu proje buna göre yapılandırılmadı.
- **App Store → Age Rating**: tüm sorular "None"; In-App Purchases var. Kids kategorisini seçme (ATT ve üçüncü taraf reklam izni değişir).

## 12. Satın alma testi (sandbox)

### iOS

1. App Store Connect → **Users and Access → Sandbox → Test Accounts** → yeni sandbox hesabı.
2. Cihazda: Ayarlar → **Geliştirici** (ya da App Store) → **Sandbox Hesabı** ile giriş.
3. Debug derlemeyi cihazdan çalıştır, Çarşı → Kese'den satın al.

### Android

1. Play Console → **Ayarlar → Lisans testi** → test e-postalarını ekle.
2. Uygulamayı **Dahili test** kanalından Play Store üzerinden yükle (yan yükleme yerine).
3. Ödeme ekranında "Test kartı, her zaman onaylar / reddeder" seçenekleriyle başarı ve hata durumlarını dene.

### Denenecekler

- Her ürünün satın alınması; tüketilebilirlerde bahşişin **bir kez** eklenmesi (işlem kimliği kaydedilir).
- İptal: "Satın alma iptal edildi. Hesabından ücret alınmadı." mesajı.
- `remove_ads` sonrası banner ve geçiş reklamı yok; uygulamayı kapatıp açınca da yok.
- Uygulamayı silip yeniden yükle → Ayarlar ya da Kese → **Satın alımları geri yükle**.
- Satın alma sırasında oyunun duraklaması ve arayüzün kilitlenmesi.

## 13. Ses dosyaları (CC0)

Efektler (damla, şeker, kaşık, yıldız…) ZzFX ile, döküm sesi `pourSynth.ts` ile kodda üretilir. Müzik ve ortam için dosya yuvaları `public/audio/manifest.json`'da; dosya yoksa oyun sessiz geçer.

| Dosya | İçerik | Arama önerisi |
|---|---|---|
| `public/audio/music_kahvehane.m4a` | Hafif, döngüsel, akustik (bağlama/ud esintisi) | "saz loop", "oud loop", "turkish acoustic" |
| `public/audio/amb_kahvehane_ugultu.m4a` | Kahvehane uğultusu (döngü) | "cafe ambience", "tea house crowd" |
| `public/audio/amb_tavla_zar.m4a` | Tavla zarı | "dice roll wood", "backgammon" |
| `public/audio/amb_caycii.m4a` | Uzaktan "Çaycııı!" | Kendin kaydedebilirsin (lisans derdi olmaz) |

CC0 kaynaklar:

- **Freesound** — <https://freesound.org> (aramada lisans filtresini **Creative Commons 0** seç)
- **OpenGameArt** — <https://opengameart.org> (lisans: CC0)
- **Kenney** — <https://kenney.nl/assets?q=audio> (tümü CC0)

Dönüştürme (küçük boyut için mono 96 kbps AAC; müzik için stereo 128 kbps yeterli):

```bash
ffmpeg -i girdi.wav -ac 1 -c:a aac -b:a 96k public/audio/amb_kahvehane_ugultu.m4a
```

Kullandığın her dosyanın kaynağını ve lisansını bu tabloya not et.

## 14. İzinler ve gerekçeleri

### Android (birleştirilmiş son manifest)

| İzin | Kaynak | Gerekçe |
|---|---|---|
| `INTERNET` | Uygulama, AdMob | Reklam ve satın alma ağ istekleri. Oyun internetsiz de baştan sona oynanır. |
| `ACCESS_NETWORK_STATE` | Uygulama, AdMob | Bağlantı yokken ödüllü reklam butonlarını "Reklam şu an yok" olarak kapatmak |
| `VIBRATE` | `@capacitor/haptics` | Döküm, servis, kombo titreşimleri (Ayarlar'dan kapatılabilir) |
| `com.google.android.gms.permission.AD_ID` | Uygulama | Android 13+ reklam kimliği (AdMob) |
| `com.android.vending.BILLING` | Uygulama, RevenueCat | Google Play uygulama içi satın alma |
| `POST_NOTIFICATIONS` | `@capacitor/local-notifications` | "Günün siparişi geldi ☕" bildirimi. Çalışma zamanı izni **yalnızca** kullanıcı açarsa (ilk günlük siparişten sonra sorulur ya da Ayarlar'dan) istenir. |
| `RECEIVE_BOOT_COMPLETED` | `@capacitor/local-notifications` | Cihaz yeniden başlayınca günlük hatırlatmanın yeniden kurulması |
| `WAKE_LOCK` | `@capacitor/local-notifications` | Bildirimin zamanında teslimi |
| ~~`SCHEDULE_EXACT_ALARM`~~, ~~`USE_EXACT_ALARM`~~ | — | **Kaldırıldı** (`tools:node="remove"`): günlük hatırlatma esnek zamanlıdır, tam zamanlı alarm gerekmez |

Konum, kişiler, kamera, mikrofon, depolama izni **yok**. Paylaşım kartı uygulamanın önbellek klasörüne yazılır, izin gerekmez.

Son manifesti doğrulamak için Android Studio'da `AndroidManifest.xml` → alttaki **Merged Manifest** sekmesi.

### iOS (`Info.plist`)

| Anahtar | Gerekçe |
|---|---|
| `NSUserTrackingUsageDescription` | App Tracking Transparency isteği (kişiselleştirilmiş reklam). Reddedilse de oyun aynen oynanır. |
| `NSPhotoLibraryAddUsageDescription` | Paylaşım sayfasında "Resmi Kaydet" seçilirse sonuç kartını Fotoğraflar'a kaydetmek |
| `GADApplicationIdentifier`, `SKAdNetworkItems` | AdMob yapılandırması (izin değil) |
| `UISupportedInterfaceOrientations` (yalnızca portre), `UIRequiresFullScreen` | Dikey kilit, iPad dahil |

## 15. Release derlemesi

1. `.env`'i gerçek değerlerle doldur; `VITE_DEV_MENU=false`, `VITE_FORCE_MOCK_*=false`.
2. `android/gradle.properties` → `ADMOB_APP_ID=...`; `Info.plist` → gerçek `GADApplicationIdentifier`.
3. Sürüm numaraları: `package.json` → `version` (Ayarlar'da görünür), `android/app/build.gradle` → `versionCode`/`versionName`, Xcode → Version/Build.
4. `npm run check && npm run cap:sync`
5. Android: **Build → Generate Signed App Bundle** (anahtar deposunu güvenli bir yerde yedekle; Play App Signing'i aç). iOS: **Product → Archive → Distribute App**.
6. Liderlik şu an simülasyon (`VITE_LEADERBOARD_MODE=mock`); ekranın altında "Rakipler simülasyondur." notu görünür. Gerçek backend bağlanınca `LeaderboardService` arayüzünü uygulayan bir sınıf ekleyip `src/services/index.ts`'de seç ve `real` moduna geç.

## 16. Tema ve görseller

- Aktif tema: `.env` → `VITE_ACTIVE_THEME` (`auto` = tarihe göre: Aralık–Şubat kış, Haziran–Ağustos yaz, 20 Ekim–2 Kasım cadılar bayramı). Geliştirici menüsünden anında değiştirilebilir.
- Tüm görseller `tools/art/` altındaki kodla çizilir: `npm run art` (yalnızca bir tema: `npm run art -- --theme=kis`). Görsel değiştirince çapaları (demlik pivot/ağız, tezgâh çizgisi) geliştirici menüsündeki **çapa düzenleyici** ile ayarla; "Kopyala" ile gelen JSON'u ilgili `manifest.json`'a işle.
- Uygulama ikonu ve splash kaynakları `assets/` altında; değiştirince `npm run cap:assets`.

## 17. Manuel test matrisi

| Durum | Kontrol |
|---|---|
| Ekran oranları | 9:16, 9:19.5–9:21 (çentikli), 3:4 ve 4:5 tablet — boşluk/kesik yok, çentik ve gezinme çubuğu içeriği kapatmıyor |
| Düşük seviye Android (2–3 GB RAM) | Döküm sırasında akıcılık; FPS düşükse otomatik düşük kalite (Ayarlar'da görünür) |
| iPhone, iPad | Dikey kilit, safe area |
| İnternetsiz açılış | Menü, mesai, günlük sipariş, çarşı (bahşişle) çalışır; reklam butonları "Reklam şu an yok", fiyatlar "Fiyat yüklenemedi" |
| Arka plana alıp dönme | Oyun duraklar, ses kesilir, dönüşte duraklatma penceresi |
| Reklam ortasında arka plan | Dönüşte oyun duraklı kalır, ödül yalnızca "ödül kazanıldı" olayıyla verilir |
| Android geri tuşu | Oyunda duraklatır, alt ekranda bir geri gider, ana menüde çıkış onayı |
| Satın alma iptali, geri yükleme | Bkz. Bölüm 12 |
| Günün siparişi | İki farklı cihazda aynı gün aynı sipariş (Europe/Istanbul gece yarısı) |
| Ayarlar | Ses, titreşim, azaltılmış hareket anında etkili ve kalıcı |
