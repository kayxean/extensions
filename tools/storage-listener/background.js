chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

let currentTabId = null;

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (info.status !== 'complete' || !tab.url?.startsWith('http')) return;
  currentTabId = tabId;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: injectStorageMonitor,
    });
  } catch (err) {
    console.error('Injection failed:', err);
  }
});

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (!currentTabId) return;
  chrome.tabs.get(currentTabId, (tab) => {
    if (!tab || !tab.url) return;
    const cookieDomain = changeInfo.cookie.domain.replace(/^\./u, '');
    if (tab.url.includes(cookieDomain)) {
      void sendStorageUpdate();
    }
  });
});

async function sendStorageUpdate() {
  if (!currentTabId) return;
  const tab = await chrome.tabs.get(currentTabId);
  if (!tab || !tab.url) return;
  const url = new URL(tab.url);
  const cookies = await chrome.cookies.getAll({ domain: url.hostname });
  const cookieObj = {};
  cookies.forEach((c) => {
    cookieObj[c.name] = c.value;
  });
  chrome.tabs
    .sendMessage(currentTabId, { type: 'COOKIE_UPDATE', payload: cookieObj })
    .catch(console.error);
}

function injectStorageMonitor() {
  if (window.hasStorageSurgeon) return;
  window.hasStorageSurgeon = true;

  let cookieData = {};

  const notify = (type) => {
    const local = {};
    for (let i = 0; i < localStorage.length; i++) local[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));

    const session = {};
    for (let i = 0; i < sessionStorage.length; i++) session[sessionStorage.key(i)] = sessionStorage.getItem(sessionStorage.key(i));

    chrome.runtime
      .sendMessage({
        type: 'STORAGE_SNAPSHOT',
        payload: { local, session, cookie: cookieData },
        storageType: type,
      })
      .catch(console.error);
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'COOKIE_UPDATE') {
      cookieData = message.payload || {};
      notify('cookie');
    }
    if (message.type === 'REQUEST_SNAPSHOT') {
      notify('init');
    }
  });

  const originalLocalSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function () {
    originalLocalSet.apply(this, arguments);
    notify('local');
  };

  const originalSessionSet = sessionStorage.setItem.bind(sessionStorage);
  sessionStorage.setItem = function () {
    originalSessionSet.apply(this, arguments);
    notify('session');
  };

  window.addEventListener('storage', (e) => {
    if (e.key === null) return;
    notify('local');
  });

  notify('init');
}
