let previousState = { local: {}, session: {}, cookie: {} };
const container = document.getElementById('diff-container');
const freezeBtn = document.getElementById('freeze');
const clearBtn = document.getElementById('clear');

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STORAGE_SNAPSHOT') {
    if (freezeBtn.checked) return;
    previousState.local = message.payload.local || {};
    previousState.session = message.payload.session || {};
    previousState.cookie = message.payload.cookie || {};
    updateUI(message.storageType);
  }
});

function updateUI(_changedType) {
  const fragment = document.createDocumentFragment();
  let hasItems = false;

  ['local', 'session', 'cookie'].forEach((type) => {
    const data = previousState[type];
    if (!data || Object.keys(data).length === 0) return;
    hasItems = true;

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';
    categoryDiv.innerHTML = `<span class="category-label">${type}Storage</span>`;
    fragment.appendChild(categoryDiv);

    for (let key in data) {
      const oldVal = previousState[type][key];
      const newVal = data[key];
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
      fragment.appendChild(div);
    }
  });

  if (!hasItems) {
    container.innerHTML = '<p class="empty-msg">Waiting for storage activity...</p>';
    return;
  }

  if (container.querySelector('.empty-msg')) {
    container.innerHTML = '';
  }
  container.appendChild(fragment);
}

clearBtn.onclick = () => {
  container.innerHTML = '<p class="empty-msg">Log cleared.</p>';
  previousState = { local: {}, session: {}, cookie: {} };
};
