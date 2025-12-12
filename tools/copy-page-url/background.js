/**
 * Function to be executed in the context of the active tab.
 * It copies the provided URL to the user's clipboard.
 * NOTE: This function is injected into the active tab's page,
 * so it has full access to the page's Document Object Model (DOM).
 * @param {string | undefined} url The URL string to copy.
 */
function copyUrlToClipboard(url) {
  if (!url) {
    console.error("No URL provided to copy.");
    return;
  }

  const tempElement = document.createElement("textarea");
  tempElement.value = url;
  tempElement.style.position = "fixed";
  tempElement.style.top = "0";
  tempElement.style.left = "0";
  tempElement.style.opacity = "0";
  document.body.appendChild(tempElement);

  tempElement.select();
  document.execCommand("copy");
  document.body.removeChild(tempElement);
  // console.log(`Quick URL Copy: URL copied successfully: ${url}`);
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "copy-url") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];

      if (currentTab && currentTab.id) {
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: copyUrlToClipboard,
          args: [currentTab.url],
        });
      }
    });
  }
});
