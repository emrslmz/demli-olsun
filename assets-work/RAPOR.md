# Görsel Üretim Raporu

Bu oturumda Gemini/Cowork erişimi olmadığından ve kullanıcı "görselleri internetten bul ya da kendin oluştur" dediğinden,
**tüm görseller kodla çizildi**: `tools/art/` altındaki üreticiler SVG üretir, Chromium (Playwright) bunları dokümandaki
adlar ve boyutlarla PNG/JPG'ye dönüştürür. Arka plan kaldırma gerekmedi (SVG zaten saydam); bu yüzden anahtar rengi
(magenta/yeşil) ve `process.py` adımları kullanılmadı.

Yeniden üretmek için: `npm run art` (tek tema: `-- --theme=kis`, tek görsel: `-- --only=char_riza`, kontak sayfası: `-- --review`).

## Üretilen görsel sayıları

| Tema | Görsel |
|---|---|
| default | 77 (8 arka plan, 15 müşteri, 8 demlik/çaydanlık, 5 eşya, 3 arayüz, 25 ikon, 2 efekt, 5 desen, 5 rozet, 1 logo) |
| kis | 22 (2 arka plan, 15 müşteri, logo, 3 dekor, `fx_snowflake`) |
| yaz | 22 (2 arka plan, 15 müşteri, logo, 3 dekor, `fx_sun_glint`) |
| halloween | 22 (2 arka plan, 15 müşteri, logo, 3 dekor, `fx_bat`) |
| Uygulama ikonu ve splash | `assets/icon-only.png`, `icon-foreground.png`, `icon-background.png`, `splash.png`, `splash-dark.png` (logo_emblem'den birleştirildi) |

## needs_help

Yok.

## Büyütülen görseller

Yok (vektörden doğrudan hedef boyutta render edildi).

## Anahtar rengi istisnaları

Uygulanmadı (saydamlık doğrudan SVG'den gelir). `fx_steam`, `fx_sparkle`, `fx_sun_glint` dokümandaki gibi siyah zeminlidir
ve oyunda toplamalı (add) karıştırmayla çizilir.

## Çapalar

Demlik/çaydanlık `pivot` ve `spout` değerleri çizimin geometrisinden hesaplanıp `manifest.json`'a yazıldı
(ağız ucu tam olarak ağzın deliğidir). Arka planlarda tezgâh çizgisi tam %68'dedir (`counterY: 0.68`).
Elle ayar yapılırsa `npm run art` var olan çapaları korur (`--reset-anchors` ile sıfırlanır).

## Kullanım şartları notu

Görseller üçüncü taraf bir üretken yapay zekâ servisiyle değil, bu depodaki kodla üretildi; harici lisans/şart kısıtı yoktur.
Gemini ile üretilecek görsellere geçilirse, Google'ın Gemini ek hizmet şartları ve Yasaklanmış Kullanım Politikası ticari
kullanımı genel olarak kısıtlamaz ancak çıktıların sorumluluğunu kullanıcıya bırakır; yayın öncesi güncel şartlar kontrol edilmelidir.
