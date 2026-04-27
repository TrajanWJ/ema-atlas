import { defineConfig } from 'wxt';

// WXT config for the Autharis Clipper.
// Keeps permissions minimal: we only read the active tab + store the last
// scraped payload in local storage + register a single context menu entry.
export default defineConfig({
  manifest: {
    name: 'Autharis Clipper',
    description:
      'Scrape a highlighted job post and deep-link it into the Autharis draft flow.',
    version: '0.0.0',
    permissions: ['activeTab', 'storage', 'contextMenus'],
    action: {
      default_title: 'Autharis Clipper',
      default_popup: 'popup.html',
    },
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png',
    },
  },
  modules: [],
  runner: { disabled: true },
});
