# Demli Olsun — Geliştirme Planı

Bu dosya `demli-olsun-prompt.md` tanımına göre hazırlanmıştır. Fazlar sırayla uygulanır; her faz ayrı bir commit olarak durur.

## Paket sürümleri (kurulum anında doğrulandı)

| Paket | Sürüm | Not |
|---|---|---|
| Node | 22 LTS (`.nvmrc`) | |
| Capacitor (`core`, `cli`, `android`, `ios`) | 8.5.x | |
| `@capacitor/app`, `haptics`, `preferences`, `share`, `filesystem`, `status-bar`, `splash-screen`, `local-notifications` | 8.x | Hepsi `@capacitor/core >=8` ister |
| `@capacitor-community/admob` | 8.2.x | Capacitor 8 uyumlu ana sürüm |
| `@revenuecat/purchases-capacitor` | 13.7.x | peer: `@capacitor/core >=8` |
| Vue | 3.5.x | |
| Pinia | 4.0.x | |
| Vite | 8.3.x | Rolldown tabanlı; `manualChunks` yerine `codeSplitting.groups` |
| Phaser | 4.2.x | WebGL; v3'ten farklar aşağıda |
| mitt | 3.0.x | |
| zzfx | 1.4.x | |
| Vitest | 5.0.x | |
| TypeScript | 5.9.x | 7.x (native) henüz `vue-tsc`/`typescript-eslint` ile uyumlu değil |
| `@capacitor/assets` (dev) | 3.0.x | İkon/splash üretimi |

## Fazlar

1. **İskelet** — Vite + Vue + TS + Pinia + Phaser + Capacitor, `PhaserHost`, tipli bus, servis arayüzleri ve mock'ları, layout + safe area, dikey kilit, boş sahneler, `ThemeService` + manifest + yer tutucu görseller.
2. **Çekirdek mekanik** — `glassModel`, `pour` (rampa + artık akış + damlalar), `teaColor`, servis, `scoring`, göstergeler, debug katmanı, Vitest testleri.
3. **Mesai** — sipariş tablosu, müşteriler, replikler, sabır, can, zorluk, şeker, bardak tipleri, yoğun saat, HUD, oyun sonu.
4. **His** — Bölüm 14 animasyonları, `AudioService` (+ `pourSynth`, ZzFX), `HapticsService`, tema dekor katmanı ve partikülleri.
5. **Meta** — `SaveService` (sürümlü), ekonomi, Çarşı (Kese hariç), ayarlar, takma ad, eğitim, günlük giriş ödülü, unvanlar.
6. **Günün Siparişi** — seed, tek hak, seri, sonuç ekranı, metin + PNG paylaşım.
7. **Liderlik** — mock servis, haftalık lig, günlük tablo, oyun sonunda sıra değişimi.
8. **Reklamlar** — AdMob, UMP + ATT, yerleşimler, `adPolicy`, test kimlikleri.
9. **Satın alma** — RevenueCat, Kese, başlangıç teklifi, geri yükleme, (opsiyonel) bildirim.
10. **Cila** — performans, tablet, ikon/splash, izin denetimi, kabul kriterleri, `SETUP.md`.

## Varsayımlar ve kararlar

- **Görseller:** Gemini/Cowork süreci bu oturumda yok. Kullanıcı "görselleri internetten bul ya da kendin oluştur" dediği için tüm görseller `tools/art/` altındaki kod ile **SVG olarak çizilir** ve Chromium (Playwright) ile görsel dokümanındaki adlar ve boyutlarla PNG/JPG'ye dönüştürülür. Stil bloğundaki kurallar (kalın koyu kahve kontur `#3B2416`, düz renk + tek yumuşak parlama, İznik paleti, yazı yok) uygulanır. Gemini görselleri geldiğinde aynı adlarla üzerine yazılabilir; oyun kodu değişmez. İnternetten görsel alınmadı (lisans/stil tutarlılığı riski).
- **Ölçekleme:** `Scale.RESIZE` kanvası CSS pikseliyle (DPR 1) çizer ve yüksek DPR'li telefonlarda bulanık görünür. Bu yüzden Phaser `Scale.NONE` modunda tutulur; `PhaserHost` ebeveyn boyutunu `ResizeObserver` ile izler, kanvası `css × DPR` (en fazla 2) piksele `scale.resize()` ile ayarlar ve `setZoom(1/DPR)` uygular. Sonuç RESIZE ile aynıdır (letterbox yok, her oranda tam ekran) ama keskindir. Tüm yerleşim `layout.ts` içinde cihaz pikseliyle hesaplanır.
- **Phaser 4 farkları:** `setTintFill` yok (`setTint().setTintMode(FILL)`), maskeler filtre oldu. Sıvı ve bardak için maske yerine **kırpma (crop)** kullanılır: bardağın iç silüeti bir kez doku olarak üretilir, seviye değiştikçe `setCrop` ile kesilir; yüzey dalgası 20 noktalı küçük bir poligondur. Bardak desenleri (decal) açılışta Canvas 2D ile bardak silüetine kırpılarak dokuya işlenir; çalışma anında maske gerekmez.
- **Renk modeli:** "Beer–Lambert benzeri": dem oranı önce ışık yolu ile ölçeklenmiş optik yoğunluğa çevrilir (`d' = 1 − (1 − d)^L`, kupa için `L > 1`), sonra dokümandaki renk duraklarından doğrusal ışık uzayında monoton bir eğriyle renk ve opaklık elde edilir. Tema rengi çaya asla etki etmez.
- **Kombo:** "1 + 0.1 × seri" ifadesinde seri, mevcut servis dahil art arda gelen ≥85 isabet sayısıdır (ilk iyi servis ×1.1).
- **Muhtar "taşmaya ekstra kızar":** taşmada can kaybına ek olarak 100 puan cezası ve kombo sıfırlanır.
- **Rıza Amca "3 yıldızın altını beğenmez":** 3 yıldızın altında bahşiş vermez ve homurdanan bir replik söyler (can kaybı yalnızca <50'de).
- **Devam modalı:** Ödüllü reklamla (mesai başına 1) ya da bahşişle (150) devam edilir; bahşiş yetmezse tek satırlık "Kese'ye git" bağlantısı görünür.
- **Günlük gün numarası:** Çıkış tarihi `2026-10-01` (Europe/Istanbul) kabul edildi (`config/economy.ts` → `LAUNCH_DATE`).
- **Bot puanları:** Her bot hafta boyunca seed'den türetilen zamanlarda "oturum" oynar; haftalık puan, o ana kadar oynanan oturumların toplamıdır. Böylece puan monoton artar, deterministiktir ve tablo hafta boyunca canlıdır.
- **Font:** Her yerde **Baloo 2** (yuvarlak, kalın, cartoon oyun yazısı; değişken ağırlık 400–800). SIL OFL 1.1; Türkçe glifler (ç ğ ı İ ö ş ü Ç Ğ Ö Ş Ü ve ₺) `fontTools` ile doğrulandı, Latin + Latin Extended alt kümeleri woff2 olarak `src/assets/fonts/` altında paketlendi (internetsiz çalışır). Fredoka denendi ama ğ/ş/İ glifleri olmadığı için elendi.
- **Ses dosyaları:** Ortam ve müzik için `public/audio/manifest.json` yuvaları tanımlı; dosya yoksa sessiz geçilir. Efektler ZzFX ile prosedürel.
- **Android/iOS derlemesi:** Bu ortamda Android SDK indirilemiyor (dl.google.com erişimi yok) ve Xcode yok; native projeler `cap add` ile üretildi ve yapılandırıldı (dikey kilit, izinler, AdMob meta-data, `Info.plist` anahtarları), ancak cihazda çalıştırma `SETUP.md`'deki adımlarla senin makinende yapılmalı.
- **`npm audit`:** Uyarılar `@capacitor/assets` (yalnızca geliştirme aracı) bağımlılıklarından geliyor; uygulama paketine girmiyor.

## Belirsiz / açık noktalar

- Bundle kimliği `com.demliolsun.app` olarak varsayıldı; `SETUP.md`'de nasıl değiştirileceği yazılı.
- Gerçek liderlik backend'i yok; `VITE_LEADERBOARD_MODE=mock` iken liderlikte "Rakipler simülasyondur" notu görünür.
- Müzik ve ortam sesleri için CC0 dosyaları `SETUP.md`'de önerildi, depoya eklenmedi.

## Durum (Faz 10 sonu)

Tüm fazlar uygulandı ve her biri ayrı commit olarak duruyor. `npm run check` (tip + lint + biçim + testler + derleme) temiz. Tarayıcıda (390×844 telefon, 768×1024 ve 1024×1366 tablet) Playwright ile ekran görüntüsü alınarak doğrulandı: takma ad → eğitim → reklam bilgisi → giriş ödülü → menü, mesai, günlük sipariş + paylaşım kartı, çarşı (canlı önizleme), liderlik, hafta sonucu, ayarlar, geliştirici menüsü, çapa düzenleyici.

Ek kararlar (Faz 5–10):

- **Günün Siparişi süresi:** Sabır bitince bardak olduğu gibi servis edilir (tek hak korunur, oyuncu boşa düşmez). Duraklatmadaki "Bardağı şimdi servis et" de aynı şekilde çalışır. Bahşiş: kabul 20 + yıldız başına 15, ret 5 (`DAILY_REWARD`).
- **Lig haftası kapanışı:** Sonuç bir kez hesaplanır ve hemen uygulanır (kademe + ödül, kayıt); pencere yalnızca gösterir. Uygulama pencere açılmadan kapansa bile ödül kaybolmaz. Mesai sonunda hafta değiştiyse önce geçen hafta kapanır.
- **Başlangıç Paketi:** 3. mesai bittiğinde oyun sonu ekranında bir kez açılır; teklif anı kayda yazılır, 48 saat Kese'de gerçek geri sayımla kalır.
- **Kese'ye git (devam penceresi):** Mesai biter, oyun sonundan menüye dönüşte geçiş reklamı gösterilmeden Kese açılır.
- **Test reklam kimlikleri:** Gerçek kimlikler yalnızca `mode=production` derlemede; `npm run build:debug` / `cap:sync:debug` her zaman Google test kimlikleriyle derler ve geliştirici menüsünü açar.
- **Bildirim izni:** İlk günlük siparişten sonra menüye dönüşte bir kez sorulur; Ayarlar'dan saatle birlikte açılıp kapatılır. Tam zamanlı alarm izinleri manifestten kaldırıldı.
- **Türkçe sayı ekleri:** "oyuncuların %20'sinden" gibi metinler için `possessiveAblative()` (testli).

## v2: sadeleştirme ve cartoon görünüm

İlk sürüm geri bildirimi: "çok detaylı, yapmacık, bardaklar gerçek bardak değil, sipariş mantığı fazla". Buna göre:

- **Gerçek ince belli bardak:** Tek bardak tipi (`ince`), gerçek çay bardağı profiliyle (geniş ağız, ince bel, tombul alt, kalın cam dip) hem görsellerde (`tools/art/lib/teaGlass.mjs`) hem oyunda (`glassModel.ts`, `glassArt.ts`) aynı. Kırmızı + yaldız bantlı beyaz porselen tabak. Siparişlerdeki düz bardak, kupa ve fincan kaldırıldı; Çarşı'daki bardaklar aynı ince belli bardağın desenli (decal) sürümleri.
- **Parlak cartoon stil:** Kalın koyu kontur, degrade gövde, gölge bandı, kenar ışığı, beyaz parlama ve yumuşak temas gölgesi (`tools/art/lib/toon.mjs`). Karakterler büyük kafalı, ifadeleri belirgin; arka planlar yalnız duvar + raf (tezgâh ayrı katman). Görseller 256 renk paletine indirilip küçültülür (`tools/art/quantize.py`).
- **Tek müşteri, görsel sipariş:** Sipariş tahtası, kart kuyruğu ve tepsi siparişleri kaldırıldı. Tezgâhın arkasında tek müşteri durur; sipariş, yanındaki konuşma balonunda küçük bir bardak resmiyle (hedef renk + doluluk), çay adıyla ve şeker sayısıyla gösterilir. Sabır balonun altındaki çubuktur.
- **Bardakta çizgi rehberi:** Ayrı göstergeler yerine bardağın üzerinde kesikli çizgiler: koyu çizgi = dem seviyesi, beyaz çizgi = doluluk. 1–2. aşamada ikisi, 3–4. aşamada yalnız doluluk çizgisi, 5. aşamada hiç çizgi yok (göz kararı). Renk körlüğü modu ve Usta Gözü iki çizgiyi hep açık tutar.
- **Demlik ve çaydanlık tezgâhta:** Basılı tutunca tezgâhtan kalkıp bardağın üstüne gelir, eğilip döker; bırakınca yerine döner.
- **Servis:** Bardak tabağıyla müşteriye gider, müşteri tepki verip ayrılır, soldan yeni boş bardak gelir.
- **Arayüz:** Krem paneller, kalın kenarlı parlak butonlar (yeşil = başla, kırmızı = birincil, mavi = paylaş), sade ana menü (büyük "Mesaiye başla", "Günün siparişi", üç kutucuk: Çarşı / Liderlik / Ayarlar).

## v3: cartoon vektör bardak ve kendi görsellerin

Geri bildirim: bardaklar daha "cartoon vektör" olsun; görselleri kullanıcı da üretebilir.

- **Bardak stili:** gradyan yerine düz renkler, daha kalın kontur, tombul göbek ve belirgin bel (abartılı profil), sağda
  tek ton gölge bandı, solda kalın beyaz parlama şeritleri, kırmızı kenarlı düz tabak. Çay neredeyse opak düz renk;
  yüzeyi açık tonlu ve konturlu. Aynı dil oyundaki canlı bardakta (`glassArt.ts`), SVG görsellerde (`teaGlass.mjs`)
  ve Çarşı kartlarında (`GlassThumb.vue`, profil `glassModel`'den) kullanılır.
- **Kendi görsellerin:** `custom-assets/<kimlik>.png` + `npm run art:custom` (`tools/art/custom.mjs`). Oyundaki bardak
  üç katmanlı PNG ile değiştirilebilir (`bardak_arka`, `bardak_ic` maske, `bardak_on`); iç profil maskeden çıkarılır
  (`core/glassMask.ts`, testli), böylece seviye/hacim/hedef çizgileri çizilen şekle uyar. Şablonlar
  `custom-assets/sablon/`. Ayrıntı: `ASSETS.md`.

## Kabul kriterleri

| Kriter | Durum |
|---|---|
| Telefonda ve tablette dikeyde boşluk/kesik yok, çentik ve gezinme çubuğu içeriği kapatmıyor | ✅ Tarayıcıda 390×844, 768×1024, 1024×1366 doğrulandı; safe area CSS + `layout.ts`. Gerçek cihazda (hareket + 3 tuşlu gezinme) `SETUP.md` §17 ile denenmeli |
| Orta-alt seviye cihazda dökümde ~60 FPS | ⏳ Cihazda ölçülmeli. Önlemler: DPR ≤ 2, ilk 5 sn < 50 FPS ise otomatik düşük kalite, menüde 30 FPS, kırpma (maske yok), havuzlu partiküller, karede bellek ayırmayan döküm/ses döngüsü |
| İnternetsiz baştan sona oynanıyor | ✅ Fontlar ve görseller pakette; reklam/IAP hataları yutulur, butonlar "Reklam şu an yok" / "Fiyat yüklenemedi" |
| Oyun sırasında reklam yok; geçiş kuralları testli | ✅ Banner yalnızca menü ve liderlikte; `adPolicy` testleri |
| `remove_ads` sonrası banner/geçiş yok, yeniden açılınca da yok | ✅ Entitlement önbelleği açılışta, menü banner'ından önce uygulanır; mağazadan yenilenir |
| Satın alımları geri yükleme | ✅ Ayarlar ve Kese; mock'ta doğrulandı, sandbox adımları `SETUP.md` §12 |
| Debug build'de yalnızca test reklam kimlikleri | ✅ `getAdUnitIds` + `build:debug` |
| Türkçe karakterler tüm fontlarda doğru | ✅ Baloo 2 Türkçe glifleri doğrulandı; `toLocale*Case('tr-TR')` |
| Ses, titreşim, hareket ayarları anında ve kalıcı | ✅ `settings.update()` servislere hemen uygular ve kaydeder |
| Günün Siparişi iki cihazda aynı gün aynı | ✅ Tarih seed'li, Europe/Istanbul gün sınırı, testli |
| Mock lider tablosu "simülasyon" notuyla | ✅ |

## Açık işler / bilinen sınırlar

- **Native derleme bu ortamda yapılamadı** (Android SDK ve Xcode yok). Native projeler yapılandırıldı; ilk derleme ve cihaz testleri `SETUP.md` adımlarıyla yapılmalı.
- **Texture atlası:** Görseller ayrı PNG'ler olarak yükleniyor (Phaser 4 çoklu doku toplu çizimi ile çizim çağrıları düşük kalıyor). Cihaz profilinde gerekirse ikon/karakter görselleri `tools/art` içinde atlasa toplanabilir.
- **Ses dosyaları** (müzik ve ortam) depoda yok; yuvalar hazır, CC0 kaynaklar `SETUP.md` §13'te.
- **Liderlik** simülasyon; gerçek backend `LeaderboardService` arayüzünün arkasına takılacak.
