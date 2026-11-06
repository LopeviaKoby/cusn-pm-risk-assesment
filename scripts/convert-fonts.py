"""Convert the two licensed variable TTF fonts to WOFF2 without subsetting.

Requires: fonttools==4.60.1 and brotli==1.1.0.
Run: py -3 scripts/convert-fonts.py
"""

from pathlib import Path
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1] / "app/src/assets/fonts"
SOURCES = (
    ROOT / "google-sans/GoogleSans-VariableFont_GRAD,opsz,wght.ttf",
    ROOT / "manrope/Manrope-VariableFont_wght.ttf",
)


def describe(font):
    axes = [(axis.axisTag, axis.minValue, axis.maxValue) for axis in font["fvar"].axes]
    characters = set().union(*(set(table.cmap) for table in font["cmap"].tables))
    return axes, characters


for source in SOURCES:
    if not (source.parent / "OFL.txt").is_file():
        raise FileNotFoundError(f"Missing OFL license: {source.parent}")
    original = TTFont(source)
    before = describe(original)
    output = source.with_suffix(".woff2")
    original.flavor = "woff2"
    original.save(output)
    converted = TTFont(output)
    after = describe(converted)
    if before != after:
        output.unlink()
        raise ValueError(f"Axes or charset changed: {source.name}")
    for character in "áéíóúñüÁÉÍÓÚÑÜçÇãõÃÕ€•":
        if ord(character) not in after[1]:
            raise ValueError(f"Missing glyph {character}: {output.name}")
    print(f"{source.name}: {source.stat().st_size} -> {output.stat().st_size} bytes; axes={after[0]}; glyphs={len(after[1])}")
