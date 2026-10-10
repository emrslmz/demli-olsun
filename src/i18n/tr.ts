/**
 * Tüm arayüz metinleri. Yapı ileride İngilizce eklenebilecek şekilde: anahtar → metin.
 * Büyük/küçük harf dönüşümlerinde HER ZAMAN upper()/lower() kullan (tr-TR).
 */

export const tr = {
  appName: 'Demli Olsun',
  common: {
    back: 'Geri',
    close: 'Kapat',
    ok: 'Tamam',
    cancel: 'Vazgeç',
    yes: 'Evet',
    no: 'Hayır',
    buy: 'Satın al',
    equip: 'Kullan',
    equipped: 'Kullanılıyor',
    owned: 'Sende var',
    preview: 'Önizle',
    loading: 'Yükleniyor…',
    priceUnavailable: 'Fiyat yüklenemedi',
    adUnavailable: 'Reklam şu an yok',
    notEnoughTips: 'Bahşiş yetmiyor',
    goToShop: "Kese'ye git",
    tips: 'Bahşiş',
  },
  splash: {
    tagline: 'Mahallenin çaycısı sensin.',
  },
  onboarding: {
    title: 'Hoş geldin, çırak!',
    body: 'Kahvehanede herkes sana ne diye seslensin?',
    placeholder: 'Takma ad',
    hint: '3–16 karakter. Harf, rakam, boşluk, _ ve - kullanılabilir.',
    suggest: 'Başka öneri',
    start: 'Önlüğü bağla',
    errShort: 'Takma ad en az 3 karakter olmalı.',
    errLong: 'Takma ad en fazla 16 karakter olabilir.',
    errChars: 'Sadece harf, rakam, boşluk, _ ve - kullanabilirsin.',
    errBad: 'Bu takma adı kullanamazsın, başka bir şey dene.',
  },
  consent: {
    title: 'Reklamlar hakkında',
    body: 'Demli Olsun ücretsiz ve reklamlarla destekleniyor. Oyun sırasında hiç reklam çıkmaz. Birazdan reklam tercihlerini soran bir pencere görebilirsin.',
    continue: 'Devam',
  },
  menu: {
    startShift: 'Mesaiye başla',
    daily: 'Günün siparişi',
    dailyDone: 'Yarın yeni sipariş: {time}',
    market: 'Çarşı',
    leaderboard: 'Liderlik',
    settings: 'Ayarlar',
    removeAds: 'Reklamsız',
    title: 'Unvan',
    nextTitle: '{title} unvanına {n} servis kaldı',
    best: 'Rekor',
  },
  boosters: {
    title: 'Güçlendiriciler',
    subtitle: 'Bu mesaide kullanmak istediklerini seç. Her birinden en fazla 1.',
    start: 'Başla',
    none: 'Güçlendiricisiz başla',
    ustaGozu: 'Usta Gözü',
    ustaGozuDesc: 'Bu mesai renk çubuğunda çayın anlık rengi hep görünür (çarpan 1.0).',
    sabirTasi: 'Sabır Taşı',
    sabirTasiDesc: 'İlk 60 sn müşterilerin sabrı %50 artar.',
    yedekBardak: 'Yedek Bardak',
    yedekBardakDesc: 'Mesaiye +1 canla başlarsın.',
    have: 'Elinde: {n}',
  },
  hud: {
    score: 'Puan',
    rush: 'Yoğun saat!',
  },
  game: {
    dem: 'Dem',
    water: 'Su',
    serve: 'Servis et',
    overflow: 'Taştı!',
    timeUp: 'Süre doldu!',
    tapToStop: 'Durdurmak için tekrar dokun',
  },
  pause: {
    title: 'Mola',
    resume: 'Devam et',
    restart: 'Baştan başla',
    quit: 'Menüye dön',
    quitConfirm: 'Mesaiyi bitirmek istiyor musun? Bu mesainin puanı kaydedilir.',
    serveNow: 'Bardağı şimdi servis et',
    dailyConfirm: 'Bardak olduğu gibi servis edilecek. Günün siparişinde tek hakkın var. Emin misin?',
  },
  continue: {
    title: 'Son bardak gitti!',
    body: 'Bir can daha alıp devam etmek ister misin?',
    watchAd: 'Reklam izle, devam et (+1 can)',
    payTips: '{n} bahşişle devam et',
    decline: 'Mesaiyi bitir',
  },
  gameOver: {
    title: 'Mesai bitti',
    newRecord: 'Yeni rekor!',
    served: 'Servis',
    avgAccuracy: 'Ortalama isabet',
    tipsEarned: 'Kazanılan bahşiş',
    bestCombo: 'En iyi seri',
    doubleTips: 'Bahşişi 2 katına çıkar',
    doubled: 'Bahşiş ikiye katlandı!',
    league: 'Haftalık lig',
    again: 'Tekrar',
    menu: 'Menü',
    share: 'Paylaş',
  },
  daily: {
    title: 'Günün siparişi #{n}',
    customer: 'Müşteri',
    accuracy: 'İsabet',
    streak: 'Seri',
    betterThan: 'Bugün oyuncuların %{n}’{sfx} iyisin.',
    keepGoing: 'Yarın daha iyisi gelir!',
    share: 'Paylaş',
    menu: 'Menü',
    nextIn: 'Sonraki sipariş: {time}',
    color: 'Renk',
    fill: 'Doluluk',
    alreadyPlayed: 'Bugünün siparişini verdin. Yarın yenisi gelecek.',
    oneShot: 'Tek hak! Renk çubuğunda yalnızca istenen renk var.',
    copied: 'Sonuç panoya kopyalandı.',
  },
  dailyReward: {
    title: 'Günlük ödül',
    day: '{n}. gün',
    claim: 'Al',
    missed: 'Bir gün kaçırırsan ödül başa döner.',
  },
  market: {
    title: 'Çarşı',
    tabs: { glasses: 'Bardaklar', pots: 'Demlikler', venues: 'Mekanlar', boosters: 'Güçlendiriciler', shop: 'Kese' },
    freeBooster: 'Bedava al (reklam)',
    freeLeft: 'Bugün {n} hak kaldı',
    premium: 'Premium',
    restore: 'Satın alımları geri yükle',
    starterPack: 'Başlangıç Paketi',
    starterDesc: '1500 bahşiş + Başlangıç bardağı + her güçlendiriciden 3',
    starterEnds: 'Teklif bitimine {time}',
    removeAdsDesc: 'Geçiş ve banner reklamları kalkar. Ödüllü reklamlar istersen kalır.',
    purchased: 'Satın alındı',
    purchaseOk: 'Satın alma tamamlandı. Afiyet olsun!',
    purchaseCancelled: 'Satın alma iptal edildi. Hesabından ücret alınmadı.',
    restoreOk: 'Satın alımların geri yüklendi.',
    restoreNone: 'Geri yüklenecek satın alım bulunamadı.',
    bought: 'Aldın!',
  },
  leaderboard: {
    title: 'Liderlik',
    tabs: { weekly: 'Haftalık lig', daily: 'Günün siparişi', allTime: 'Tüm zamanlar' },
    league: '{name} Ligi',
    promote: 'İlk {n} yükselir',
    demote: 'Son {n} düşer',
    endsIn: 'Bitime {time}',
    gap: 'Bir üst sıraya {n} puan',
    first: 'Zirvedesin!',
    simulated: 'Rakipler simülasyondur.',
    you: 'Sen',
    noDaily: 'Bugünün siparişini henüz vermedin.',
  },
  leagueResult: {
    promoted: '{name} ligine yükseldin!',
    demoted: '{name} ligine düştün.',
    stayed: '{name} liginde kaldın.',
    rank: 'Geçen hafta {n}. oldun.',
    reward: '+{n} bahşiş',
  },
  starter: {
    title: 'Başlangıç Paketi',
    body: 'Çırağa özel, bir kerelik teklif!',
    later: 'Belki sonra',
  },
  settings: {
    title: 'Ayarlar',
    music: 'Müzik',
    sfx: 'Efektler',
    haptics: 'Titreşim',
    reducedMotion: 'Azaltılmış hareket',
    colorBlind: 'Renk körlüğü modu',
    colorBlindDesc: 'Renk çubuğunda çayın anlık rengi hep işaretlenir (▲).',
    nickname: 'Takma adı değiştir',
    tutorial: 'Eğitimi tekrar oyna',
    restore: 'Satın alımları geri yükle',
    adPrefs: 'Reklam tercihleri',
    privacy: 'Gizlilik politikası',
    notifications: 'Günün siparişi bildirimi',
    notifyHour: 'Bildirim saati',
    reset: 'Kaydı sıfırla',
    resetConfirm: 'Tüm ilerlemen, bahşişlerin ve eşyaların silinecek. Emin misin?',
    version: 'Sürüm',
    lowQuality: 'Düşük grafik kalitesi',
  },
  tutorial: {
    skip: 'Eğitimi atla',
    step1a: 'Önce dem: demliğe basılı tut. Bardağın üçte biri kadar dem yeter.',
    step1b: 'Şimdi su: çaydanlığa basılı tut. Renk çubuğunda ▲ işaret ▼ hedefe gelince ve bardak balondaki kadar dolunca bırak.',
    step1c: 'Hedefe yaklaştın. Servis et!',
    step2a: 'Açık çay az demle olur. Bıraktıktan sonra birkaç damla daha düşer: biraz erken bırak!',
    step2b: 'Gördün mü? Artık akış devam etti. Servis et.',
    step3: 'Şimdi sıra sende. Siparişi tuttur ve servis et!',
    done: 'Aferin çırak! Mesaiye hazırsın.',
  },
  exitConfirm: 'Oyundan çıkmak istiyor musun?',
  errors: {
    generic: 'Bir şeyler ters gitti. Lütfen tekrar dene.',
    offline: 'İnternet yok. Oyun internetsiz de oynanır; liderlik, reklam ve satın alma şu an kapalı.',
    offlineShop: 'İnternet yok: satın almalar şu an yapılamaz.',
  },
}

/** Basit yer tutucu doldurma: t('Dem %{n}', { n: 35 }). */
export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}

/**
 * Sayıdan sonra gelen iyelik + ayrılma eki (3. tekil): 20 → "sinden", 30 → "undan", 4 → "ünden".
 * Ünlü uyumu sayının okunuşundaki son kelimeye göre belirlenir.
 */
export function possessiveAblative(n: number): string {
  const v = Math.abs(Math.round(n))
  const ones = ['ından', 'inden', 'sinden', 'ünden', 'ünden', 'inden', 'sından', 'sinden', 'inden', 'undan']
  const tens = ['', 'undan', 'sinden', 'undan', 'ından', 'sinden', 'ından', 'inden', 'inden', 'ından']
  if (v === 0) return 'ından'
  if (v % 1000 === 0) return 'inden'
  if (v % 100 === 0) return 'ünden'
  if (v % 10 !== 0) return ones[v % 10] as string
  return tens[Math.floor(v / 10) % 10] as string
}

export function upper(s: string): string {
  return s.toLocaleUpperCase('tr-TR')
}

export function lower(s: string): string {
  return s.toLocaleLowerCase('tr-TR')
}

const nf = new Intl.NumberFormat('tr-TR')
export function num(n: number): string {
  return nf.format(Math.round(n))
}

export function pct1(n: number): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)
}

/** 3 sa 12 dk / 12 dk 05 sn */
export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d} g ${h} sa`
  if (h > 0) return `${h} sa ${String(m).padStart(2, '0')} dk`
  return `${m} dk ${String(sec).padStart(2, '0')} sn`
}
