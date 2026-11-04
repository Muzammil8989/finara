import sys
from PIL import Image, ImageDraw
d = sys.argv[1]
def load(n, bg, size=260, circle=False):
    im = Image.open(f"{d}/expo/{n}").convert("RGBA").resize((size, size), Image.LANCZOS)
    tile = Image.new("RGBA", (size, size), bg)
    tile.alpha_composite(im)
    if circle:
        m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).ellipse((0, 0, size, size), fill=255)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0)); out.paste(tile, (0, 0), m); return out
    return tile
teal = (13, 92, 99, 255)
items = [load("icon.png", teal), load("android-icon-foreground.png", teal, circle=True),
         load("android-icon-monochrome.png", (60, 60, 60, 255), circle=True), load("splash-icon.png", teal),
         load("notification-icon.png", (40, 40, 40, 255)), load("favicon.png", (251, 247, 240, 255))]
W = 20 + len(items) * 280
sheet = Image.new("RGBA", (W, 300), (240, 236, 228, 255))
for i, it in enumerate(items): sheet.alpha_composite(it, (20 + i * 280, 20))
sheet.save(f"{d}/expo-sheet.png")
