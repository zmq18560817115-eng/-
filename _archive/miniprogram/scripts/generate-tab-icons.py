#!/usr/bin/env python3
"""Generate WeChat mini program tabBar icons (81x81 PNG)."""
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '.tmp-pillow-lib'))

from PIL import Image, ImageDraw  # noqa: E402

OUT = os.path.join(ROOT, 'assets', 'icons')
SIZE = 81
W = 3


def canvas():
    return Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))


def rgba(hex_color):
    h = hex_color.lstrip('#')
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def star(draw, cx, cy, r_outer, r_inner, color, points=4, rotation=-math.pi / 2):
    pts = []
    for i in range(points * 2):
        ang = rotation + i * math.pi / points
        r = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(pts, fill=color)


def draw_sparkles(draw, color):
    star(draw, 40, 42, 17, 7, color)
    star(draw, 58, 24, 7, 3, color)
    draw.rounded_rectangle([22, 54, 30, 58], radius=1, fill=color)
    draw.rounded_rectangle([24, 50, 28, 62], radius=1, fill=color)


def draw_award(draw, color):
    cx, cy = 40, 36
    draw.ellipse([cx - 17, cy - 17, cx + 17, cy + 17], outline=color, width=W)
    draw.polygon([(cx, cy - 7), (cx + 6, cy + 5), (cx - 6, cy + 5)], fill=color)
    draw.polygon([(cx - 11, cy + 14), (cx - 5, cy + 30), (cx - 1, cy + 16)], fill=color)
    draw.polygon([(cx + 11, cy + 14), (cx + 5, cy + 30), (cx + 1, cy + 16)], fill=color)


def draw_settings(draw, color):
    cx, cy = 40, 40
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], outline=color, width=W)
    for i in range(8):
        ang = i * math.pi / 4
        x1 = cx + 11 * math.cos(ang)
        y1 = cy + 11 * math.sin(ang)
        x2 = cx + 22 * math.cos(ang)
        y2 = cy + 22 * math.sin(ang)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=W)
        bx = cx + 24 * math.cos(ang)
        by = cy + 24 * math.sin(ang)
        draw.ellipse([bx - 3.5, by - 3.5, bx + 3.5, by + 3.5], fill=color)


ICONS = [
    ('therapy', draw_sparkles),
    ('rewards', draw_award),
    ('settings', draw_settings),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in ICONS:
        for suffix, hex_color in [('', '#64748b'), ('-active', '#6366f1')]:
            img = canvas()
            draw = ImageDraw.Draw(img)
            fn(draw, rgba(hex_color))
            path = os.path.join(OUT, f'{name}{suffix}.png')
            img.save(path, 'PNG')
            print(path, os.path.getsize(path))


if __name__ == '__main__':
    main()
