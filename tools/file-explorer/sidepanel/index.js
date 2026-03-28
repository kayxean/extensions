const HOME_PATH = 'file:///home/rsp/';
let lastClickedFile = null;

await syncWithTab();

chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('file:///')) {
    await syncWithTab();
  }
});

chrome.tabs.onActivated.addListener(async () => {
  await syncWithTab();
});

async function syncWithTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.startsWith('file:///')) {
    document.getElementById('file-list').innerHTML = '<em>Open a local folder to begin.</em>';
    return;
  }

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: () => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return {
          currentUrl: window.location.href,
          links: anchors.map((a) => {
            const row = a.closest('tr') || a.parentElement;
            let date = '';
            if (row) {
              const dateCell = row.querySelector('td:nth-child(3), td:nth-child(4)');
              if (dateCell) date = dateCell.innerText.trim();
            }
            return { name: a.innerText, url: a.href, date };
          }),
        };
      },
    },
    async (results) => {
      if (results && results[0].result) {
        const { currentUrl, links } = results[0].result;

        if (!currentUrl.endsWith('/') && links.length === 0) {
          await showMetadataForUrl(currentUrl);
        } else {
          lastClickedFile = null;
          displayFiles(links, tab.id);
        }
      }
    },
  );
}

function displayFiles(files, tabId) {
  const container = document.getElementById('file-list');
  container.innerHTML = '';

  files.forEach((file) => {
    if (
      file.name === '..' ||
      file.name === 'Name' ||
      file.name === 'Size' ||
      file.name === 'Last Modified'
    )
      return;

    const link = document.createElement('a');
    link.className = 'file-link';
    const isDir = file.url.endsWith('/');
    link.textContent = (isDir ? '📁 ' : '📄 ') + file.name;
    link.href = '#';

    link.onclick = async (e) => {
      e.preventDefault();
      lastClickedFile = { url: file.url, date: file.date };
      chrome.tabs.update(tabId, { url: file.url });
    };

    container.appendChild(link);
  });
}

async function showMetadataForUrl(url) {
  const container = document.getElementById('file-list');
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'meta-header';
  header.textContent = 'Quick Info';
  container.appendChild(header);

  const content = document.createElement('div');
  content.id = 'meta-content';
  container.appendChild(content);

  const cleanPath = decodeURIComponent(url.replace('file://', ''));
  const fileName = cleanPath.split('/').pop();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    md: 'text/markdown',
    py: 'text/x-python',
    ts: 'text/typescript',
    sh: 'application/x-sh',
    zip: 'application/zip',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  const fileDate = lastClickedFile?.date || '';

  content.innerHTML = `
    <div class="meta-row"><strong>Path:</strong> <code>${cleanPath}</code></div>
    <div class="meta-row"><strong>Name:</strong> ${fileName}</div>
    <div class="meta-row"><strong>Type:</strong> ${mimeType}</div>
    ${fileDate ? `<div class="meta-row"><strong>Modified:</strong> ${fileDate}</div>` : ''}
  `;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const info = { size: null, width: null, height: null, date: null };

        if (document.images && document.images.length > 0) {
          const img = document.images[0];
          info.width = img.naturalWidth;
          info.height = img.naturalHeight;
          info.size = img.fileSize || null;
          if (img.src) {
            info.date = img.getAttribute('date') || img.getAttribute('datetime') || null;
          }
        }

        if (!info.date) {
          const lastMeta = document.querySelector('meta[http-equiv="last-modified"]');
          if (lastMeta) {
            info.date = lastMeta.content;
          }
        }

        if (!info.date) {
          const dateElem = document.querySelector('[datetime], [date], [data-date]');
          if (dateElem) {
            info.date =
              dateElem.getAttribute('datetime') ||
              dateElem.getAttribute('date') ||
              dateElem.getAttribute('data-date') ||
              null;
          }
        }

        if (!info.size && document.body && document.body.innerText) {
          info.size = new Blob([document.body.innerText]).size;
        }

        if (!info.size) {
          const resources = performance.getEntriesByType('resource');
          for (const res of resources) {
            if (res.transferSize) {
              info.size = res.transferSize;
              break;
            }
          }
        }

        if (!info.size) {
          const navInfo = performance.getEntriesByType('navigation')[0];
          if (navInfo) {
            info.size = navInfo.transferSize || navInfo.encodedBodySize || null;
          }
        }

        return info;
      },
    });

    if (result && result[0] && result[0].result) {
      const { size, width, height, date } = result[0].result;

      if (width && height) {
        content.innerHTML += `<div class="meta-row"><strong>Dimensions:</strong> ${width} x ${height}</div>`;
      }

      if (size) {
        content.innerHTML += `<div class="meta-row"><strong>Size:</strong> ${(size / 1024).toFixed(2)} KB</div>`;
      }

      if (date) {
        content.innerHTML += `<div class="meta-row"><strong>Modified:</strong> ${date}</div>`;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('back-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.startsWith('file:///')) {
    chrome.tabs.goBack(tab.id);
  }
});

document.getElementById('home-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.update(tab.id, { url: HOME_PATH });
  }
});
