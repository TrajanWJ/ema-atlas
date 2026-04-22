#!/usr/bin/env bash
# build-pdfs.sh — render content/briefs/*.md to printable PDFs.
#
# Three rendering paths, in order of preference:
#   1. The atlas Next.js /briefs/<slug> route printed via headless Chrome
#      (gives us the styled CSS print version)
#   2. pandoc + wkhtmltopdf or weasyprint (markdown direct)
#   3. pure pandoc to PDF via LaTeX
#
# The script picks the first available path. Output lands in
# content/briefs/pdf/<slug>.pdf. Idempotent.
#
# Status: STUB. Wired enough to detect tooling and dry-run; full pipeline
# requires picking a renderer. See howto/add-a-deliverable.md for context.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
have() { command -v "$1" >/dev/null 2>&1; }
mkdir -p content/briefs/pdf

renderer=""
if have chromium || have google-chrome || have "google-chrome-stable"; then
  renderer="chrome"
elif have pandoc && (have wkhtmltopdf || have weasyprint); then
  renderer="pandoc-html"
elif have pandoc && have xelatex; then
  renderer="pandoc-latex"
fi

if [ -z "$renderer" ]; then
  echo "no PDF renderer found. install one of:"
  echo "  - chromium / google-chrome (preferred — uses atlas /briefs CSS)"
  echo "  - pandoc + (wkhtmltopdf | weasyprint)"
  echo "  - pandoc + texlive-xetex"
  exit 1
fi
echo "renderer: $renderer"

case "$renderer" in
  chrome)
    # Requires the atlas dev server running on localhost:3000.
    if ! curl -fsS -m 1 http://localhost:3000/ >/dev/null 2>&1; then
      echo "atlas dev server not running on :3000. run 'npm run dev' first."
      exit 1
    fi
    chrome_bin=$(command -v chromium || command -v google-chrome || command -v google-chrome-stable)
    for f in content/briefs/*.md; do
      slug=$(basename "$f" .md)
      [ "$slug" = "pdf" ] && continue
      out="content/briefs/pdf/${slug}.pdf"
      echo "rendering $slug -> $out"
      "$chrome_bin" --headless --disable-gpu --no-sandbox \
        --print-to-pdf="$out" \
        "http://localhost:3000/briefs/${slug}" || echo "  failed"
    done
    ;;

  pandoc-html)
    # Direct from markdown — does NOT use atlas styles.
    for f in content/briefs/*.md; do
      slug=$(basename "$f" .md)
      [ "$slug" = "pdf" ] && continue
      out="content/briefs/pdf/${slug}.pdf"
      echo "rendering $slug -> $out"
      pandoc "$f" -o "$out" \
        --pdf-engine=$(have wkhtmltopdf && echo wkhtmltopdf || echo weasyprint) \
        --metadata title="$(echo "$slug" | tr '-' ' ')"
    done
    ;;

  pandoc-latex)
    for f in content/briefs/*.md; do
      slug=$(basename "$f" .md)
      [ "$slug" = "pdf" ] && continue
      out="content/briefs/pdf/${slug}.pdf"
      echo "rendering $slug -> $out"
      pandoc "$f" -o "$out" --pdf-engine=xelatex \
        --metadata title="$(echo "$slug" | tr '-' ' ')"
    done
    ;;
esac

echo "done. $(ls content/briefs/pdf/ 2>/dev/null | wc -l) pdf(s)."
