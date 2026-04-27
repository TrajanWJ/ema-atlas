// Content script: runs on the 4 supported job-board domains.
// Listens for AUTHARIS_SCRAPE messages from the background worker, runs the
// site-specific parser, and returns a normalized CreateJobRequestInput-shaped
// payload.

import { parseLinkedIn } from '../lib/parsers/linkedin';
import { parseUpwork } from '../lib/parsers/upwork';
import { parseLever } from '../lib/parsers/lever';
import { parseGreenhouse } from '../lib/parsers/greenhouse';
import { normalize, type RawScrape } from '../lib/normalize';

export default defineContentScript({
  matches: [
    '*://*.linkedin.com/*',
    '*://*.upwork.com/*',
    '*://*.lever.co/*',
    '*://*.greenhouse.io/*',
  ],
  main() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type !== 'AUTHARIS_SCRAPE') return;
      try {
        const host = location.hostname;
        const selection = (msg.selectionText as string) || currentSelection();
        let raw: RawScrape;
        if (host.includes('linkedin.com')) raw = parseLinkedIn(document, selection);
        else if (host.includes('upwork.com')) raw = parseUpwork(document, selection);
        else if (host.endsWith('lever.co') || host.includes('.lever.co'))
          raw = parseLever(document, selection);
        else if (host.includes('greenhouse.io')) raw = parseGreenhouse(document, selection);
        else raw = { title: document.title, description: selection, company: '', skills: [] };
        const payload = normalize(raw, { sourceUrl: location.href });
        sendResponse(payload);
      } catch (err) {
        console.warn('[autharis] content scrape error', err);
        sendResponse({ error: String(err) });
      }
      return true;
    });
  },
});

function currentSelection(): string {
  const sel = window.getSelection?.();
  return sel ? sel.toString() : '';
}
