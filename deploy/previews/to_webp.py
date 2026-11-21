"""Turns the recordings from capture.mjs into the card images next to this file.

    py -I deploy/previews/to_webp.py [folder ...]

For each game it writes <folder>.webp (a looping clip, about 4 seconds) and <folder>-still.webp (one frame
from the middle, or where the recipe's `still` says). Needs Pillow (py -m pip install pillow).
"""
import glob
import json
import os
import sys
import tempfile

from PIL import Image

WIDTH, HEIGHT = 560, 315  # 16:9, sharp on a 2x screen at card size
FRAMES = os.path.join(tempfile.gettempdir(), 'games-previews')
OUT = os.path.dirname(os.path.abspath(__file__))

only = sys.argv[1:]
for game_dir in sorted(glob.glob(os.path.join(FRAMES, '*'))):
    game = os.path.basename(game_dir)
    if only and game not in only:
        continue
    meta = json.load(open(os.path.join(game_dir, 'meta.json')))
    frames = []
    for f in sorted(glob.glob(os.path.join(game_dir, '*.jpg'))):
        im = Image.open(f).convert('RGB')
        if meta['crop']:
            x, y, w, h = meta['crop']
            im = im.crop((x, y, x + w, y + h))
        frames.append(im.resize((WIDTH, HEIGHT), Image.LANCZOS))

    # runs of identical frames become one longer frame
    ms = round(1000 / meta['fps'])
    merged, durations = [], []
    for im in frames:
        if merged and im.tobytes() == merged[-1].tobytes():
            durations[-1] += ms
        else:
            merged.append(im)
            durations.append(ms)

    clip = os.path.join(OUT, f'{game}.webp')
    if len(merged) > 1:
        merged[0].save(clip, save_all=True, append_images=merged[1:], duration=durations, loop=0,
                       quality=58, method=6, minimize_size=True)
    else:
        merged[0].save(clip, quality=80, method=6)
    still = os.path.join(OUT, f'{game}-still.webp')
    frames[min(len(frames) - 1, int(len(frames) * meta.get('still', 0.5)))].save(still, quality=80, method=6)
    print(f'{game:15} clip {os.path.getsize(clip) // 1024:4} KB  still {os.path.getsize(still) // 1024:3} KB')
