/** Müşteri replikleri (Bölüm 6.3). Her müşteri için her isabet aralığında en az 4 replik. */

import type { CustomerId } from './customers'

export type LineBucket = 'p95' | 'p85' | 'p70' | 'p50' | 'reject' | 'overflow' | 'impatient' | 'left'

type Lines = Record<LineBucket, string[]>

export const LINES: Record<CustomerId, Lines> = {
  riza: {
    p95: ['Ohh, eline sağlık evladım.', 'Mis gibi! Tam benim çayım.', 'Mahallenin çaycısı sensin.', 'İşte tavşan kanı böyle olur!', 'Babana rahmet, ne güzel demlemişsin.'],
    p85: ['İçilir, içilir.', 'Fena değil, fena değil.', 'Hı, olmuş sayılır.', 'Eskisi gibi değil ama güzel.'],
    p70: ['Biraz açık olmuş ama idare eder.', 'Bizim zamanımızda daha iyiydi.', 'Eh işte… içeriz artık.', 'Bir dahakine dikkat et evladım.'],
    p50: ['Bu ne, su mu bu?', 'Hiç beğenmedim evladım.', 'Tavla zarı bile daha demli.', 'Gözlüğüm mü bozuk, çay mı?'],
    reject: ['Geri götür bunu!', 'Bunu ben içmem evladım.', 'Yok yok, olmamış bu.', 'Çaycı başka yere mi gitti?'],
    overflow: ['Masayı yüzdürdün be!', 'Tavla tahtam ıslandı!', 'Aman evladım, dikkat!', 'Pantolonum gitti!'],
    impatient: ['Çaycııı!', 'Unuttun mu bizi?', 'Çay ne oldu evladım?', 'Sakal bıraktım bekleye bekleye.'],
    left: ['Ben gidiyorum, sen demle dur.', 'Yaşlı adamı beklettin.', 'Evde içerim ben.', 'Hadi hayırlısı.'],
  },
  muhtar: {
    p95: ['Mahallenin çaycısı sensin.', 'Muhtarlıkta bile böylesi yok!', 'Eline sağlık, gönlüne sağlık.', 'Seni bir sonraki toplantıya çağıracağım.'],
    p85: ['Fena değil, fena değil.', 'İçilir, içilir.', 'Muhtar onaylıyor.', 'Güzel olmuş, aferin.'],
    p70: ['Biraz açık olmuş ama idare eder.', 'Daha demli isterdim.', 'Not alıyorum, bir dahakine.', 'Olur, olur… ama tam değil.'],
    p50: ['Bu ne, su mu bu?', 'Bunu mahalleliye anlatamam.', 'Böyle çay olmaz kardeşim.', 'Toplantıda bundan bahsederim.'],
    reject: ['Geri götür bunu!', 'Ben muhtarım, bunu içmem!', 'Bu çay değil, tutanak lazım!', 'Kabul edilemez!'],
    overflow: ['Masayı yüzdürdün be!', 'Evraklarım ıslandı!', 'Dikkat et, mühür burada!', 'Bunu tutanağa yazacağım!'],
    impatient: ['Çaycııı!', 'Unuttun mu bizi?', 'Muhtarı bekletmek olmaz!', 'Toplantıya geç kalacağım.'],
    left: ['İşim var, gidiyorum.', 'Muhtarlığa dönüyorum.', 'Sonra uğrarım.', 'Bu iş böyle yürümez.'],
  },
  taksici: {
    p95: ['Eline sağlık abi, uçtum!', 'Mis gibi, motor çalıştı!', 'Mahallenin çaycısı sensin.', 'Bu çayla İstanbul turu atarım!'],
    p85: ['İçilir, içilir.', 'Fena değil, yola devam.', 'Olmuş abi, eyvallah.', 'İyi iyi, hadi bakalım.'],
    p70: ['Biraz açık olmuş ama idare eder.', 'Neyse, yolda içerim.', 'Tam değil ama olsun.', 'Hızlı ol da, kusura bakmam.'],
    p50: ['Bu ne, su mu bu?', 'Abi bu çay değil.', 'Durakta daha iyisi var.', 'Bu çayla direksiyona geçilmez.'],
    reject: ['Geri götür bunu!', 'Yok abi, almayayım.', 'Olmamış bu, hiç olmamış.', 'Taksimetre kadar acı bu!'],
    overflow: ['Masayı yüzdürdün be!', 'Anahtarlarım ıslandı!', 'Abi dikkat, araba temiz!', 'Sel bastı abi!'],
    impatient: ['Çaycııı!', 'Abi müşteri bekliyor!', 'Hadi hadi, acelem var!', 'Unuttun mu bizi?'],
    left: ['Müşteri geldi, kaçtım!', 'Durakta içerim.', 'Yok abi, beklemem.', 'Kontak kapalı değil, gidiyorum.'],
  },
  ogrenci: {
    p95: ['Hocam bu çay efsane!', 'Mis gibi, ders çalışırım artık.', 'Mahallenin çaycısı sensin.', 'Finalleri bu çayla geçerim!'],
    p85: ['İçilir, içilir.', 'Fena değil, sağ olun.', 'Gayet iyi hocam.', 'Ders arasına yeter.'],
    p70: ['Biraz açık olmuş ama idare eder.', 'Hmm, tam değil ama olur.', 'Yarım dedim ama… neyse.', 'İdare eder hocam.'],
    p50: ['Bu ne, su mu bu?', 'Hocam bu biraz garip olmuş.', 'Yurttaki çay bile daha iyi.', 'Bunu içersem uyurum.'],
    reject: ['Geri götür bunu!', 'Hocam bu olmamış, kusura bakmayın.', 'Bunu içemem ya.', 'Ben açık demiştim ama…'],
    overflow: ['Masayı yüzdürdün be!', 'Notlarım ıslandı!', 'Kulaklığım gitti!', 'Hocam her yer çay oldu!'],
    impatient: ['Çaycııı!', 'Hocam ders başlıyor!', 'Unuttunuz mu beni?', 'Servis kaçacak…'],
    left: ['Derse geç kalıyorum, kaçtım!', 'Kantinde içerim.', 'Neyse, sonra gelirim.', 'Kütüphane kapanacak!'],
  },
  esnaf: {
    p95: ['Ohh, eline sağlık kuzum!', 'Dükkân bayram etti!', 'Mahallenin çaycısı sensin.', 'Bütün çarşı bu çayı konuşacak!'],
    p85: ['İçilir, içilir.', 'Fena değil canım, sağ ol.', 'Güzel olmuş kuzum.', 'Müşteriler beğenir bunu.'],
    p70: ['Biraz açık olmuş ama idare eder.', 'Olur canım, olur.', 'Biraz daha özen kuzum.', 'Tepsiye koy, idare ederiz.'],
    p50: ['Bu ne, su mu bu?', 'Kuzum bu çay olmamış.', 'Müşterime bunu veremem.', 'Bunu ben içmem canım.'],
    reject: ['Geri götür bunu!', 'Olmaz kuzum, olmaz.', 'Bunu dükkâna götüremem!', 'Bir daha demle canım.'],
    overflow: ['Masayı yüzdürdün be!', 'Önlüğüm gitti!', 'Tepsi sel oldu kuzum!', 'Aman, dükkânı su bastı!'],
    impatient: ['Çaycııı!', 'Dükkân boş kaldı kuzum!', 'Unuttun mu bizi?', 'Müşteriler bekliyor!'],
    left: ['Dükkân bekliyor, gittim!', 'Ben başka yerden alırım.', 'Hadi kuzum, sonra.', 'Tezgâh açık kaldı!'],
  },
}

export const COMBO_TEXTS = ['Eline sağlık!', 'Maşallah!', 'Çay ustası!', 'Demin hası!', 'Bravo!', 'Tam kıvamında!']

export const BUCKET_EMOJI: Record<LineBucket, string> = {
  p95: '😍',
  p85: '😊',
  p70: '🙂',
  p50: '😕',
  reject: '😠',
  overflow: '💦',
  impatient: '⏰',
  left: '😤',
}

export function bucketFor(accuracy: number, accepted: boolean): LineBucket {
  if (!accepted) return 'reject'
  if (accuracy >= 95) return 'p95'
  if (accuracy >= 85) return 'p85'
  if (accuracy >= 70) return 'p70'
  return 'p50'
}

export function pickLine(customer: CustomerId, bucket: LineBucket, rand: () => number = Math.random): string {
  const list = LINES[customer][bucket]
  return list[Math.floor(rand() * list.length)] as string
}
