"""Makes the FlashGames card's clip: the rotation's games all playing at once, in a grid.

    node deploy/previews/capture.mjs dungeonjoe smashyourbros geodegobbler-saloon infinitehive altwhiskerwars shoallhell
    py -I deploy/previews/montage.py flashgames dungeonjoe smashyourbros geodegobbler-saloon infinitehive altwhiskerwars shoallhell
    py -I deploy/previews/to_webp.py flashgames

It reads each game's latest recording from capture.mjs (<temp>/games-previews/<game>/, each made by that game's own
recipe, so every tile is real play) and writes a grid of them as new frames in <temp>/games-previews/<out>/, which
to_webp.py turns into <out>.webp and <out>-still.webp like any other card. Six games make 3 x 2, four make 2 x 2.
Each tile is cut from the middle of its game's frame (FOCUS moves it sideways). The clip is 5 seconds; a shorter
recording loops. Don't run to_webp.py on the source games afterwards unless you mean to refresh their own cards too.
"""
import glob
import json
import math
import os
import sys
import tempfile

from PIL import Image

FRAMES = os.path.join(tempfile.gettempdir(), 'games-previews')
W, H = 1280, 720
GAP = 8
BG = (18, 15, 51)  # FlashGames' --bg
# where each tile's window sits across its game's frame, 0 (left edge) to 1 (right edge)
FOCUS = {'smashyourbros': 0.55, 'infinitehive': 0.0, 'geodegobbler-saloon': 0.6}

out, games = sys.argv[1], sys.argv[2:]
if len(games) < 2:
    sys.exit('usage: py -I deploy/previews/montage.py <out> <game> <game> [...]')
cols = 2 if len(games) <= 4 else 3
rows = math.ceil(len(games) / cols)
tw = (W - GAP * (cols + 1)) // cols
th = (H - GAP * (rows + 1)) // rows


def frames_of(game):
    d = os.path.join(FRAMES, game)
    meta = json.load(open(os.path.join(d, 'meta.json')))
    files = sorted(glob.glob(os.path.join(d, '*.jpg')))
    if not files:
        sys.exit(f'no recording for {game}: run capture.mjs {game} first')
    return meta, files


def tile(path, meta, game):
    im = Image.open(path).convert('RGB')
    if meta['crop']:
        x, y, w, h = meta['crop']
        im = im.crop((x, y, x + w, y + h))
    im = im.resize((W, H), Image.LANCZOS)
    # the widest window of the tile's shape that fits the frame
    cw = min(W, round(H * tw / th))
    ch = min(H, round(cw * th / tw))
    left = round((W - cw) * FOCUS.get(game, 0.5))
    top = (H - ch) // 2
    return im.crop((left, top, left + cw, top + ch)).resize((tw, th), Image.LANCZOS)


sources = [(g, *frames_of(g)) for g in games]
# 5 seconds, like the other cards' clips
n = min(60, max(len(files) for _, _, files in sources))
dest = os.path.join(FRAMES, out)
os.makedirs(dest, exist_ok=True)
for old in glob.glob(os.path.join(dest, '*.jpg')):
    os.remove(old)
for i in range(n):
    canvas = Image.new('RGB', (W, H), BG)
    for k, (game, meta, files) in enumerate(sources):
        c, r = k % cols, k // cols
        # a short last row is centred
        in_row = min(cols, len(games) - r * cols)
        x0 = GAP + c * (tw + GAP) + (cols - in_row) * (tw + GAP) // 2
        canvas.paste(tile(files[i % len(files)], meta, game), (x0, GAP + r * (th + GAP)))
    canvas.save(os.path.join(dest, f'{i:03d}.jpg'), quality=92)
json.dump({'fps': 12, 'crop': None, 'still': 0.5}, open(os.path.join(dest, 'meta.json'), 'w'))
print(f'{out}: {n} frames, {cols} x {rows} grid of {", ".join(games)}')
