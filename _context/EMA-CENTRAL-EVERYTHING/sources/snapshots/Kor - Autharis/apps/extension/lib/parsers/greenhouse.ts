import type { RawScrape } from '../normalize';

// Greenhouse boards parser. URL shape: boards.greenhouse.io/<company>/jobs/<id>
// Also handles embedded boards at job-boards.greenhouse.io.
export function parseGreenhouse(doc: Document, selection: string): RawScrape {
  const title =
    text(doc, '.app-title, h1.app-title, h1') ||
    doc.title.replace(/\s*-\s*.+$/, '');

  const company =
    text(doc, '.company-name') ||
    text(doc, 'span.company-name') ||
    (() => {
      const seg = location.pathname.split('/').filter(Boolean)[0];
      return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : '';
    })();

  const description =
    selection ||
    text(doc, '#content') ||
    text(doc, '.content, .job__description') ||
    text(doc, 'main');

  const compensation =
    firstMatch(description, /\$[\d,.kKmM\s\-to]+(?:\/(?:hr|yr))?/) || '';

  const skills: string[] = [];
  doc.querySelectorAll('.location, .department').forEach((el) => {
    const t = el.textContent?.trim();
    if (t) skills.push(t);
  });

  return {
    title: title.trim(),
    company: company.trim(),
    description: description.trim(),
    compensation,
    skills,
  };
}

function text(doc: Document, sel: string): string {
  const el = doc.querySelector(sel);
  return el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}
function firstMatch(s: string, re: RegExp): string {
  const m = re.exec(s);
  return m ? m[0] : '';
}
