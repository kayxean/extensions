chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

let currentTabId = null;

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!info.status === 'complete' || !tab.url?.startsWith('http')) return;
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
    const cookieDomain = changeInfo.cookie.domain.replace(/^\./, '');
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
    .catch(() => {});
}

function injectStorageMonitor() {
  if (window.hasStorageSurgeon) return;
  window.hasStorageSurgeon = true;

  let cookieData = {};

  const toObj = (storage) => {
    const obj = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      obj[key] = storage.getItem(key);
    }
    return obj;
  };

  const notify = (type) => {
    chrome.runtime
      .sendMessage({
        type: 'STORAGE_SNAPSHOT',
        payload: {
          local: toObj(localStorage),
          session: toObj(sessionStorage),
          cookie: cookieData,
        },
        storageType: type,
      })
      .catch(() => {});
  };

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'COOKIE_UPDATE') {
      cookieData = message.payload || {};
      notify('cookie');
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
