let previousState = { local: {}, session: {}, cookie: {} };
const container = document.querySelector('#diff-container');
const freezeBtn = document.querySelector('#freeze');
const clearBtn = document.querySelector('#clear');

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STORAGE_SNAPSHOT') {
    if (freezeBtn.checked) return;
    updateUI(message.payload, message.storageType);
    previousState.local = { ...message.payload.local };
    previousState.session = { ...message.payload.session };
    previousState.cookie = { ...message.payload.cookie };
  }
});

function updateUI(payload, _changedType) {
  const fragment = document.createDocumentFragment();
  let hasItems = false;

  ['local', 'session', 'cookie'].forEach((type) => {
    const newData = payload[type] || {};
    const oldData = previousState[type] || {};
    if (Object.keys(newData).length === 0) return;
    hasItems = true;

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';
    categoryDiv.innerHTML = `<span class="category-label">${type}Storage</span>`;
    fragment.append(categoryDiv);

    for (const key in newData) {
      const oldVal = oldData[key];
      const newVal = newData[key];
      const isModified = oldVal !== undefined && oldVal !== newVal;

      const div = document.createElement('div');
      div.className = 'diff-item' + (isModified ? ' modified' : '');

      if (isModified) {
        div.innerHTML = `
          <span class="key">${key}</span>
          <span class="old-val">${oldVal}</span>
          <span class="val">${newVal}</span>
        `;
      } else {
        div.innerHTML = `
          <span class="key">${key}</span>
          <span class="val">${newVal}</span>
        `;
      }
      fragment.append(div);
    }
  });

  if (!hasItems) {
    container.innerHTML = '<p class="empty-msg">Waiting for storage activity...</p>';
    return;
  }

  if (container.querySelector('.empty-msg')) {
    container.innerHTML = '';
  }
  container.append(fragment);
}

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
if (tab?.id) {
  try { await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_SNAPSHOT' }); } catch (err) { console.error(err); }
}

clearBtn.addEventListener('click', () => {
  container.innerHTML = '<p class="empty-msg">Log cleared.</p>';
  previousState = { local: {}, session: {}, cookie: {} };
});
