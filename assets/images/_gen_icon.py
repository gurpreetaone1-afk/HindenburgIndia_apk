"""One-shot icon generator for Hindenburg India.

    python assets/images/_gen_icon.py     (run from the project root)
    python _gen_icon.py                    (run from this directory)

Generates icon.png + adaptive-icon.png + splash.png from the tricolor "H"
brand mark used by the web app (`frontend-user/public/icons/icon-512.png` —
the Ashoka-chakra "H" on a #0a0a0a rounded square). We crop the "H" glyph out
of that square and re-compose it at the right size for each surface, mirroring
the web PWA icon so the mobile app and the web install-prompt share one
identity. Also refreshes the in-app wordmark (logo1.png) from the web.

Requires Pillow:  pip install pillow
"""
import os
from shutil import copyfile
from PIL import Image

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
# Web brand sources (repo layout: <root>/hindenburg indian apk + <root>/Hindenburg indian webggg)
WEB_ICON = os.path.join(OUT_DIR, "../../../Hindenburg indian webggg/frontend-user/public/icons/icon-512.png")
WEB_LOGO = os.path.join(OUT_DIR, "../../../Hindenburg indian webggg/frontend-user/public/logo1.png")

BG = (10, 10, 10, 255)  # #0a0a0a — brand background (splash + adaptive bg)


def glyph(src: Image.Image) -> Image.Image:
    """Crop the tricolor 'H' out of the square icon (drop the black field)."""
    px = src.load()
    w, h = src.size
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 16 and max(r, g, b) > 55:  # "ink": visible + not near-black
                mp[x, y] = 255
    return src.crop(mask.getbbox())


def fit(mark: Image.Image, cw: int, ch: int, frac: float, bg=BG) -> Image.Image:
    """Center `mark` on a cw x ch canvas, scaled so its longer side = frac*min(cw,ch)."""
    canvas = Image.new("RGBA", (cw, ch), bg)
    base = int(min(cw, ch) * frac)
    gw, gh = mark.size
    scale = base / max(gw, gh)
    nw, nh = max(1, round(gw * scale)), max(1, round(gh * scale))
    canvas.alpha_composite(mark.resize((nw, nh), Image.LANCZOS),
                           ((cw - nw) // 2, (ch - nh) // 2))
    return canvas


def main() -> None:
    if not os.path.isfile(WEB_ICON):
        raise SystemExit(f"web brand source missing: {WEB_ICON}")
    mark = glyph(Image.open(WEB_ICON).convert("RGBA"))

    # icon.png — opaque 1024 square, H on #0a0a0a (iOS applies its own mask).
    fit(mark, 1024, 1024, 0.64).convert("RGB").save(os.path.join(OUT_DIR, "icon.png"))
    print("wrote icon.png")

    # adaptive-icon.png — transparent 1024 foreground, H in the Android safe
    # zone. app.json android.adaptiveIcon.backgroundColor = #0a0a0a.
    fit(mark, 1024, 1024, 0.56, bg=(0, 0, 0, 0)).save(os.path.join(OUT_DIR, "adaptive-icon.png"))
    print("wrote adaptive-icon.png")

    # splash.png — H centered on #0a0a0a, resizeMode "contain" in app.json.
    fit(mark, 1242, 2436, 0.40).convert("RGB").save(os.path.join(OUT_DIR, "splash.png"))
    print("wrote splash.png")

    if os.path.isfile(WEB_LOGO):
        copyfile(WEB_LOGO, os.path.join(OUT_DIR, "logo1.png"))
        print("wrote logo1.png")


if __name__ == "__main__":
    main()
