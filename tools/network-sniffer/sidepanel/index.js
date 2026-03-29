const requestList = document.getElementById('request-list');
const clearBtn = document.getElementById('clear');

function renderRequest(data) {
  const { method, url, timeStamp } = data;

  const li = document.createElement('li');
  li.className = 'request-item';
  li.innerHTML = `
    <span class="time">[${timeStamp}]</span>
    <span class="method">${method}</span>
    <span class="url" title="${url}">${url}</span>
  `;

  requestList.insertBefore(li, requestList.firstChild);
}

chrome.storage.local.get({ history: [] }, (result) => {
  result.history
    .slice()
    .reverse()
    .forEach((req) => renderRequest(req));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NETWORK_REQUEST') {
    renderRequest(message.payload);
  }
});

clearBtn.addEventListener('click', () => {
  requestList.innerHTML = '';
  chrome.storage.local.set({ history: [] });
});
