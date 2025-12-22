async function copyUrlToClipboard(url) {
  if (!url) {
    console.error('No URL provided to copy.');
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    console.log('URL copied to clipboard successfully!');
  } catch (err) {
    console.error('Failed to copy occurred in the injected tab: ', err);
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'copy-url') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];

      if (currentTab?.id) {
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: copyUrlToClipboard,
          args: [currentTab.url],
        });
      }
    });
  }
});
