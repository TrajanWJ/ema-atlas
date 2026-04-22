#!/usr/bin/env python3
import sys, pathlib, re
root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('.')
needle = sys.argv[2].lower() if len(sys.argv) > 2 else ''
for path in root.rglob('*'):
    if path.suffix not in {'.qmd', '.md'}:
        continue
    try:
        text = path.read_text(errors='ignore')
    except Exception:
        continue
    if needle in text.lower() or needle in path.name.lower():
        print(path)
