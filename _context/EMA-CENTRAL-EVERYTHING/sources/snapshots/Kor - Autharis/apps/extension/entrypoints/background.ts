// Background service worker.
// - Registers the "Send to Autharis" context menu on page + selection.
// - On click, asks the content script to scrape the current selection.
// - Stashes the scraped payload in chrome.storage.local and opens the popup.
//
// We intentionally do NOT auto-open popup.html in a window: MV3 forbids
// programmatic popup opening from a context-menu handler on most platforms.
// Instead we write the payload to storage and surface a notification badge;
// the user then clicks the toolbar icon to review + dispatch.

export default defineBackground(() => {
  const MENU_ID = 'autharis-send';

  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Send to Autharis',
      contexts: ['selection', 'page', 'link'],
      documentUrlPatterns: [
        '*://*.linkedin.com/*',
        '*://*.upwork.com/*',
        '*://*.lever.co/*',
        '*://*.greenhouse.io/*',
      ],
    });
  });

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id) return;
    try {
      const payload = await chrome.tabs.sendMessage(tab.id, {
        type: 'AUTHARIS_SCRAPE',
        selectionText: info.selectionText ?? '',
      });
      await chrome.storage.local.set({
        lastPayload: payload,
        lastCapturedAt: new Date().toISOString(),
        lastSourceUrl: tab.url ?? '',
      });
      await chrome.action.setBadgeText({ text: '1', tabId: tab.id });
      await chrome.action.setBadgeBackgroundColor({ color: '#111111' });
    } catch (err) {
      console.warn('[autharis] scrape failed', err);
    }
  });

  // Allow the popup to clear the badge once it has read the payload.
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'AUTHARIS_CLEAR_BADGE') {
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ ok: true });
    }
    return true;
  });
});
