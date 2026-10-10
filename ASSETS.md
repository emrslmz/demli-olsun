# Kendi görsellerini oyuna koymak

Oyundaki tüm görseller şu an kodla çiziliyor (`tools/art/`). İstediğin görseli kendin çizip (Illustrator, Procreate,
Figma, yapay zekâ aracı vb.) aynı adla oyuna koyabilirsin; kod değişmez.

## Kısaca

1. Görseli **dosya adı = görsel kimliği** olacak şekilde `custom-assets/` klasörüne koy.
   Örnek: `custom-assets/char_riza_happy.png`, `custom-assets/bardak_on.png`
2. Çalıştır:
   ```bash
   npm run art:custom
   ```
   Dosya doğru tema klasörüne kopyalanır, `manifest.json` (dosya yolu, boyut) güncellenir. Adı tanınmayan dosyalar
   atlanır ve uyarı verilir. Beklenenden farklı en/boy oranındaki görseller için de uyarı çıkar.
3. `npm run dev` ile tarayıcıda bak; telefona göndermek için `npm run cap:sync`.

- Yalnızca bir temada değişsin istiyorsan alt klasör kullan: `custom-assets/kis/char_riza_happy.png`
  (temalar: `kis`, `yaz`, `halloween`; kök klasör = varsayılan tema).
- `npm run art` (her şeyi koddan yeniden üretir) en sonda `custom-assets/` klasörünü yeniden uygular. Yani kendi
  görsellerin kodla üretilenlerin altında kalmaz.
- Biçim: **PNG** (şeffaf arka planlı), arka planlar için JPG de olur. WebP de okunur.
- Boyutlar aşağıdaki tablodaki gibi olmalı; daha büyük çizip aynı orana küçültebilirsin. Oran tutarsa farklı
  çözünürlük de çalışır.

## Stil önerisi (mevcut görsellerle uyum için)

- Kalın, koyu kahve kontur (`#3B2416`), düz renk dolgular, tek ton gölge bandı (sağ alt), beyaz parlama lekeleri.
- Işık sol üstten gelir. Şeffaf arka plan, nesne tuvalin ortasında.

## Oyundaki bardak (en önemlisi)

Oyunda doldurulan bardak tek bir resim değil, **üç katman**. Çay ikisinin arasında çizilir ve seviyesine göre kesilir:

| Dosya | Ne çiziliyor | Not |
|---|---|---|
| `bardak_arka.png` | Çayın **arkasında** kalan iç cam tonu ve ağzın arka kenarı | İsteğe bağlı |
| `bardak_ic.png` | **İç maske**: çayın kaplayabileceği alan **opak** (renk önemsiz), dışı **şeffaf** | Zorunlu |
| `bardak_on.png` | Çayın **önünde** kalan her şey: kontur, parlamalar, ağız, kalın cam dip, desen | Zorunlu; iç kısmı şeffaf ya da yarı şeffaf olmalı ki çay görünsün |

Kurallar:

- Üç dosya **aynı tuval boyutunda** ve **üst üste tam hizalı** olmalı (önerilen: ~650 × 1100 px).
- Bakış hafif yukarıdan (~15°): ağız ve dip **elips**; elipsin yüksekliği genişliğinin ~¼'ü kadar.
- `bardak_ic` maskesinin en üstü ağız elipsinin arka kenarı, en altı dip elipsinin ön kenarıdır. Oyun bu maskeden
  bardağın iç şeklini **kendisi çıkarır**: çay seviyesi, hacim hesabı ve hedef çizgileri senin çizdiğin şekle göre ayarlanır.
- Bardağın tabağa oturduğu yer `bardak_on`'daki en alttaki opak piksellerdir.
- Hazır şablonlar `custom-assets/sablon/` klasöründe: oyunun şu anki bardağının üç katmanı ve `onizleme.png`
  (soldan: arka, iç maske, ön, birleşik). Bunları açıp üzerine çizmek en kolayı.
- Çarşı'daki bardak çeşitleri için ayrı ön/arka yüz koyabilirsin: `bardak_on_nazar.png`, `bardak_on_lale.png`,
  `bardak_on_yaldiz.png`, `bardak_on_kristal.png`, `bardak_on_baslangic.png` (aynı şekilde `bardak_arka_<ad>.png`).
  Koymazsan çeşidin deseni (`decal_*`) senin bardağının üzerine sarılır.
- Bu üç dosya varsa oyundaki bardak, menüdeki büyük bardak, sipariş balonundaki küçük bardak ve Çarşı kartları
  otomatik olarak senin çiziminle görünür. Silersen kodla çizilen bardağa geri döner.

## Tüm görseller

| Kimlik | Boyut (px) | Biçim | Ne |
|---|---|---|---|
| `char_<müşteri>_<ifade>` | 640 × 640 | PNG | Müşteriler. Müşteri: `riza`, `muhtar`, `taksici`, `ogrenci`, `esnaf`. İfade: `neutral`, `happy`, `angry`. Tezgâhın arkasında durur: alt ~%12'si tezgâhın arkasında kalır, kafa üst yarıda. |
| `bg_<mekân>_phone` | 1080 × 2340 | JPG | Arka plan (telefon). Mekân: `mahalle`, `sahil`, `rize`, `bogaz`. Yalnızca duvar/raf/pencere; **yüksekliğin %50'sinden aşağısı tezgâhın arkasında kalır**. |
| `bg_<mekân>_tablet` | 1536 × 2048 | JPG | Aynı arka plan, tablet oranı. |
| `prop_tezgah_ust` | 1080 × 560 | JPG | Tezgâhın üst yüzeyi (ahşap). |
| `prop_tezgah_on` | 1080 × 720 | JPG | Tezgâhın ön paneli (butonların arkası). |
| `pot_demlik_<malzeme>` | 768 × 620 | PNG | Demlik, **ağzı sağa bakar**. Malzeme: `celik`, `emaye`, `porselen`, `bakir`. |
| `pot_caydanlik_<malzeme>` | 768 × 768 | PNG | Çaydanlık, ağzı sağa bakar (oyun sağdakini aynalar). |
| `prop_tabak` | 512 × 512 | PNG | Bardağın altındaki tabak, ortada, hafif yukarıdan. |
| `prop_sekerlik` | 512 × 512 | PNG | Şekerlik. |
| `prop_seker` | 128 × 128 | PNG | Tek küp şeker. |
| `prop_kasik` | 256 × 256 | PNG | Çay kaşığı. |
| `prop_tepsi` | 768 × 768 | PNG | Tepsi. |
| `icon_*` | 256 × 256 | PNG | Arayüz ikonları: `coin`, `life`, `life_broken`, `sugar`, `star`, `star_empty`, `fire`, `gift`, `lock`, `ad`, `trophy`, `share`, `pause`, `settings`, `shop`, `music`, `sfx`, `vibration`, `back`, `close`, `clock`, `dem`, `water`, `serve`, `info` (ör. `icon_coin.png`). |
| `decal_*` | 512 × 512 | PNG | Bardağa sarılan desenler: `decal_nazar`, `decal_lale`, `decal_yaldiz`, `decal_kristal`, `decal_baslangic`. |
| `badge_*` | 512 × 512 | PNG | Lig rozetleri: `badge_mahalle`, `badge_ilce`, `badge_sehir`, `badge_bolge`, `badge_turkiye`. |
| `logo_emblem` | 1024 × 1024 | PNG | Logo amblemi. |
| `fx_steam`, `fx_sparkle` | 256 / 128 | PNG | Buhar ve parıltı. **Siyah arka plan** üzerine beyaz çizilir (oyun "ekleme" karışımıyla çizer). |
| `deco_counter` | 512 × 512 | PNG | Yalnızca temalarda (`custom-assets/kis/` vb.): tezgâh süsü. |

Uygulama ikonu ve açılış ekranı bu sistemin dışında: `assets/icon-only.png`, `assets/icon-foreground.png`,
`assets/splash.png`, `assets/splash-dark.png` dosyalarını değiştirip `npm run cap:assets` çalıştır.

## Demlik ağzı ve tutma noktası

Demlik/çaydanlık çizimini değiştirince çayın aktığı ağız noktası kayabilir. Tarayıcıda ana menüde logoya **5 kez**
dokun → geliştirici menüsü → **çapa düzenleyici**. Ağız (spout) ve tutma noktasını (pivot) sürükle, "Kopyala" ile gelen
JSON'u `public/assets/themes/default/manifest.json` içindeki ilgili kayda yapıştır. `npm run art:custom` bu çapaları korur.
