chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-page-url') {
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

  if (command === 'swap-my-ex') {
    const ids = ['nfmlkliedggdodlbgghmmchhgckjoaml', 'ddkjiahejlhfcafbddmgiahcphecmpfh'];
    for (const id of ids) {
      try {
        const ext = await chrome.management.get(id);
        await chrome.management.setEnabled(id, !ext.enabled);
        console.log(`${ext.name} is now ${!ext.enabled ? 'enabled' : 'disabled'}`);
      } catch (err) {
        console.error(`Failed to toggle extension ${id}:`, err);
      }
    }
  }
});

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
