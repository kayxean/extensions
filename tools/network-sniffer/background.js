chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.type !== 'xmlhttprequest') return;

    const request = {
      url: details.url,
      method: details.method,
      statusCode: details.statusCode,
      responseSize: details.responseSize || details.transferSize || null,
      timeStamp: new Date(details.timeStamp).toLocaleTimeString(),
    };

    chrome.storage.local.get({ history: [] }, (result) => {
      const history = [request, ...result.history].slice(0, 50);
      chrome.storage.local.set({ history });
    });

    chrome.runtime
      .sendMessage({ type: 'NETWORK_REQUEST', payload: request })
      .catch(() => {});
  },
  { urls: ['<all_urls>'] },
);
