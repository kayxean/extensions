const requestList = document.querySelector('#request-list');
const clearBtn = document.querySelector('#clear');
const filterInput = document.querySelector('#filter');
const pauseBtn = document.querySelector('#pause-btn');
let paused = false;
let buffer = [];

function formatSize(bytes) {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function methodClass(method) {
  return 'method-' + method.toLowerCase();
}

function renderRequest(data) {
  const { method, url, timeStamp, statusCode, responseSize } = data;

  const li = document.createElement('li');
  li.className = 'request-item';

  const statusText = statusCode === undefined ? '…' : statusCode;
  const sizeText = formatSize(responseSize);

  li.innerHTML = `
    <span class="time">[${timeStamp}]</span>
    <span class="status">${statusText}</span>
    <span class="${methodClass(method)}">${method}</span>
    <span class="size">${sizeText}</span>
    <span class="url" title="${url}">${url}</span>
  `;

  if (filterInput.value && !url.toLowerCase().includes(filterInput.value.toLowerCase())) {
    li.dataset.filtered = 'true';
  }

  requestList.insertBefore(li, requestList.firstChild);
}

function flushBuffer() {
  for (const req of buffer) {
    renderRequest(req);
  }
  buffer = [];
}

chrome.storage.local.get({ history: [] }, (result) => {
  result.history
    .toReversed()
    .forEach((req) => renderRequest(req));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'NETWORK_REQUEST') {
    if (paused) {
      buffer.push(message.payload);
    } else {
      renderRequest(message.payload);
    }
  }
});

clearBtn.addEventListener('click', () => {
  requestList.innerHTML = '';
  buffer = [];
  chrome.storage.local.set({ history: [] });
});

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.classList.toggle('active', paused);
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if (!paused) {
    flushBuffer();
  }
});

filterInput.addEventListener('input', () => {
  const query = filterInput.value.toLowerCase();
  for (const item of requestList.children) {
    if (!query || item.textContent.toLowerCase().includes(query)) {
      item.dataset.filtered = 'false';
    } else {
      item.dataset.filtered = 'true';
    }
  }
});
