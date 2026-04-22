---
type: knowledge
wiki_id: system/Web-Research-Tools
imported_from: vault/System/Web-Research-Tools.md
imported_at: '2026-04-04T00:23:57.271Z'
tags: []
summary: ''
---
# Web Research Tools — Architecture & Usage

**Location:** , , 
**Installed:** 2026-03-26
**Status:** Active

## Problem This Solves

Previous  had a broken fetch layer (Python f-strings mangled through bash heredoc quoting → garbage output). No content extraction library installed. Brave API key missing. Jina reader not integrated.

## Architecture



## Libraries Installed

Defaulting to user installation because normal site-packages is not writeable
Collecting trafilatura
  Downloading trafilatura-2.0.0-py3-none-any.whl.metadata (12 kB)
Collecting readability-lxml
  Downloading readability_lxml-0.8.4.1-py3-none-any.whl.metadata (4.0 kB)
Collecting markdownify
  Downloading markdownify-1.2.2-py3-none-any.whl.metadata (9.9 kB)
Requirement already satisfied: certifi in /usr/lib/python3/dist-packages (from trafilatura) (2023.11.17)
Collecting charset_normalizer>=3.4.0 (from trafilatura)
  Downloading charset_normalizer-3.4.REDACTED_TOKEN.whl.metadata (40 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 40.6/40.6 kB 2.3 MB/s eta 0:00:00
Collecting courlan>=1.3.2 (from trafilatura)
  Downloading courlan-1.3.2-py3-none-any.whl.metadata (17 kB)
Collecting htmldate>=1.9.2 (from trafilatura)
  Downloading htmldate-1.9.4-py3-none-any.whl.metadata (10 kB)
Collecting justext>=3.0.1 (from trafilatura)
  Downloading justext-3.0.2-py2.py3-none-any.whl.metadata (7.3 kB)
Requirement already satisfied: lxml>=5.3.0 in ./.local/lib/python3.12/site-packages (from trafilatura) (6.0.2)
Requirement already satisfied: urllib3<3,>=1.26 in /usr/lib/python3/dist-packages (from trafilatura) (2.0.7)
Requirement already satisfied: chardet in /usr/lib/python3/dist-packages (from readability-lxml) (5.2.0)
Collecting cssselect (from readability-lxml)
  Downloading cssselect-1.4.0-py3-none-any.whl.metadata (2.4 kB)
Collecting beautifulsoup4<5,>=4.9 (from markdownify)
  Downloading beautifulsoup4-4.14.3-py3-none-any.whl.metadata (3.8 kB)
Requirement already satisfied: six<2,>=1.15 in /usr/lib/python3/dist-packages (from markdownify) (1.16.0)
Collecting soupsieve>=1.6.1 (from beautifulsoup4<5,>=4.9->markdownify)
  Downloading soupsieve-2.8.3-py3-none-any.whl.metadata (4.6 kB)
Requirement already satisfied: typing-extensions>=4.0.0 in ./.local/lib/python3.12/site-packages (from beautifulsoup4<5,>=4.9->markdownify) (4.15.0)
Collecting babel>=2.16.0 (from courlan>=1.3.2->trafilatura)
  Downloading babel-2.18.0-py3-none-any.whl.metadata (2.2 kB)
Collecting tld>=0.13 (from courlan>=1.3.2->trafilatura)
  Downloading tld-0.13.2-py2.py3-none-any.whl.metadata (11 kB)
Collecting dateparser>=1.1.2 (from htmldate>=1.9.2->trafilatura)
  Downloading dateparser-1.4.0-py3-none-any.whl.metadata (31 kB)
Collecting python-dateutil>=2.9.0.post0 (from htmldate>=1.9.2->trafilatura)
  Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl.metadata (8.4 kB)
Collecting lxml_html_clean (from lxml[html_clean]->readability-lxml)
  Downloading lxml_html_clean-0.4.4-py3-none-any.whl.metadata (2.4 kB)
Collecting pytz>=2024.2 (from dateparser>=1.1.2->htmldate>=1.9.2->trafilatura)
  Downloading pytz-2026.1.post1-py2.py3-none-any.whl.metadata (22 kB)
Collecting regex>=2024.9.11 (from dateparser>=1.1.2->htmldate>=1.9.2->trafilatura)
  Downloading regex-2026.2.REDACTED_TOKEN.whl.metadata (40 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 40.4/40.4 kB 2.7 MB/s eta 0:00:00
Collecting tzlocal>=0.2 (from dateparser>=1.1.2->htmldate>=1.9.2->trafilatura)
  Downloading tzlocal-5.3.1-py3-none-any.whl.metadata (7.6 kB)
Downloading trafilatura-2.0.0-py3-none-any.whl (132 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 132.6/132.6 kB 5.0 MB/s eta 0:00:00
Downloading readability_lxml-0.8.4.1-py3-none-any.whl (19 kB)
Downloading markdownify-1.2.2-py3-none-any.whl (15 kB)
Downloading beautifulsoup4-4.14.3-py3-none-any.whl (107 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 107.7/107.7 kB 4.7 MB/s eta 0:00:00
Downloading charset_normalizer-3.4.REDACTED_TOKEN.whl (207 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 207.3/207.3 kB 6.3 MB/s eta 0:00:00
Downloading courlan-1.3.2-py3-none-any.whl (33 kB)
Downloading htmldate-1.9.4-py3-none-any.whl (31 kB)
Downloading justext-3.0.2-py2.py3-none-any.whl (837 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 837.9/837.9 kB 10.0 MB/s eta 0:00:00
Downloading cssselect-1.4.0-py3-none-any.whl (18 kB)
Downloading babel-2.18.0-py3-none-any.whl (10.2 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 10.2/10.2 MB 14.5 MB/s eta 0:00:00
Downloading dateparser-1.4.0-py3-none-any.whl (300 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 300.4/300.4 kB 10.8 MB/s eta 0:00:00
Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl (229 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 229.9/229.9 kB 1.8 MB/s eta 0:00:00
Downloading soupsieve-2.8.3-py3-none-any.whl (37 kB)
Downloading tld-0.13.2-py2.py3-none-any.whl (296 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 296.7/296.7 kB 7.1 MB/s eta 0:00:00
Downloading lxml_html_clean-0.4.4-py3-none-any.whl (14 kB)
Downloading pytz-2026.1.post1-py2.py3-none-any.whl (510 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 510.5/510.5 kB 11.8 MB/s eta 0:00:00
Downloading regex-2026.2.REDACTED_TOKEN.whl (802 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 802.0/802.0 kB 11.0 MB/s eta 0:00:00
Downloading tzlocal-5.3.1-py3-none-any.whl (18 kB)
Installing collected packages: pytz, tzlocal, tld, soupsieve, regex, python-dateutil, lxml_html_clean, cssselect, charset_normalizer, babel, dateparser, courlan, beautifulsoup4, readability-lxml, markdownify, justext, htmldate, trafilatura
Successfully installed babel-2.18.0 beautifulsoup4-4.14.3 charset_normalizer-3.4.6 courlan-1.3.2 cssselect-1.4.0 dateparser-1.4.0 htmldate-1.9.4 justext-3.0.2 lxml_html_clean-0.4.4 markdownify-1.2.2 python-dateutil-2.9.0.post0 pytz-2026.1.post1 readability-lxml-0.8.4.1 regex-2026.2.28 soupsieve-2.8.3 tld-0.13.2 trafilatura-2.0.0 tzlocal-5.3.1

## Usage



## Quality Before vs After

| Metric | Before | After |
|--------|--------|-------|
| Fetch quality | Broken (f-string bash quoting bug) | trafilatura markdown extraction |
| JS-heavy pages | Failed silently | jina.ai reader fallback |
| Dynamic pages | Not handled | playwright chromium fallback |
| Garbage detection | None | is_garbage() filter, jina fallback |
| Search sources | SearXNG (sometimes), DDG fallback | SearXNG + GH API + HN Algolia + Jina |
| Content encoding | Accept-Encoding: br (garbled) | gzip/deflate only (clean) |

## Known Issues / TODO

- Brave API key not configured → more web coverage if added
- readability-lxml throws ValueError on some pages with NULL bytes (handled by fallback)
- Reddit search still basic (no Pushshift, just SearXNG)
- No caching layer — repeated queries hit the network every time

## Related Files

-  — entry point (updated 2026-03-26)
-  — content extraction engine
-  — search aggregation engine
-  — uses web-search.sh
-  — uses web-search.sh for Reddit scraping
