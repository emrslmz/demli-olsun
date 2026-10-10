#!/usr/bin/env python3
"""PNG'leri 256 renk paletine indirger (saydamlık korunur). Görsel fark yok denecek kadar az, boyut ~6 kat küçük.
Kullanım: python3 tools/art/quantize.py <klasör> [<klasör> ...]   (fx/ klasörü atlanır: toplamalı karışım)"""
import os
import sys

from PIL import Image

saved = 0
for root_dir in sys.argv[1:]:
    for root, _, files in os.walk(root_dir):
        if os.sep + 'fx' in root:
            continue
        for name in files:
            if not name.endswith('.png'):
                continue
            path = os.path.join(root, name)
            before = os.path.getsize(path)
            im = Image.open(path)
            if im.mode == 'P':
                continue
            q = im.convert('RGBA').quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
            tmp = path + '.tmp'
            q.save(tmp, format='PNG', optimize=True)
            if os.path.getsize(tmp) < before:
                os.replace(tmp, path)
                saved += before - os.path.getsize(path)
            else:
                os.remove(tmp)
print(f'[art] palet sıkıştırma: {saved / 1048576:.1f} MB kazanıldı')
