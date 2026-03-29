chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type === 'xmlhttprequest') {
      const newRequest = {
        url: details.url,
        method: details.method,
        timeStamp: new Date(details.timeStamp).toLocaleTimeString(),
      };

      chrome.storage.local.get({ history: [] }, (result) => {
        const history = [newRequest, ...result.history].slice(0, 50);
        chrome.storage.local.set({ history });
      });

      chrome.runtime
        .sendMessage({
          type: 'NETWORK_REQUEST',
          payload: newRequest,
        })
        .catch(() => {});
    }
  },
  { urls: ['<all_urls>'] },
);
