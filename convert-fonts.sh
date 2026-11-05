#!/usr/bin/env bash
# PMO TIVIT-Almaviva · Conversión TTF → WOFF2 (Fase 3, pendiente).
# Uso (Git Bash / WSL / Linux):  bash convert-fonts.sh
# No toca package.json ni pnpm-lock.json. Aislado: solo python3 + fontTools + Brotli.
# Mantiene TTF funcionales como fallback; solo tras validar WOFF2 se actualiza fonts.css.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GS_TTF="$ROOT/src/assets/fonts/google-sans/GoogleSans-VariableFont_GRAD,opsz,wght.ttf"
MN_TTF="$ROOT/src/assets/fonts/manrope/Manrope-VariableFont_wght.ttf"
GS_W2="$ROOT/src/assets/fonts/google-sans/GoogleSans-VariableFont_GRAD,opsz,wght.woff2"
MN_W2="$ROOT/src/assets/fonts/manrope/Manrope-VariableFont_wght.woff2"
need() { command -v "$1" >/dev/null 2>&1 || { echo "FALTA prerequisito: $1" >&2; exit 2; }; }
need python3
python3 - <<'PY'
import sys
try:
    import fontTools
    import brotli
except Exception as e:
    print(f"FALTA prerequisito python: fontTools+Brotli ({e}). Instala aislado: python3 -m pip install --user fonttools brotli", file=sys.stderr)
    sys.exit(2)
print(f"fontTools {fontTools.version} + Brotli OK")
PY
for f in "$GS_TTF" "$MN_TTF"; do [ -f "$f" ] || { echo "FALTA TTF: $f" >&2; exit 2; }; done
python3 - "$GS_TTF" "$MN_TTF" "$GS_W2" "$MN_W2" <<'PY'
import sys
from fontTools.ttLib import TTFont
srcs = [(sys.argv[1], sys.argv[3]), (sys.argv[2], sys.argv[4])]
for src, dst in srcs:
    font = TTFont(src)
    # Preserva ejes wght (Google Sans 400-700, Manrope 200-800) y tablas; sin subsetting.
    font.flavor = "woff2"
    font.save(dst)
    print(f"OK {src} -> {dst}")
PY
python3 - "$GS_W2" "$MN_W2" <<'PY'
import os, sys
from fontTools.ttLib import TTFont
for p in sys.argv[1:]:
    st = os.stat(p)
    assert st.st_size > 1024, f"WOFF2 sospechoso: {p}"
    f = TTFont(p)
    assert f.flavor == "woff2" or p.endswith(".woff2"), f"sin firma woff2: {p}"
    assert "glyf" in f or "CFF " in f or "glyf" in f.keys() or len(f.getGlyphOrder()) > 100, f"tablas insuficientes: {p}"
    print(f"VALIDA {p} bytes={st.st_size} glifos={len(f.getGlyphOrder())}")
PY
ls -l "$GS_W2" "$MN_W2"
echo "Listo. Verifica en navegador (Network WOFF2, document.fonts.ready) y luego actualiza @font-face con woff2 primero + ttf fallback."
