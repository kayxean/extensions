let lastClickedFile = null;
let showDotfiles = false;

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
    document.querySelector('#file-list').innerHTML = '<em>Open a local folder to begin.</em>';
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
          displayFiles(links);
        }
      }
    },
  );
}

function displayFiles(files) {
  const container = document.querySelector('#file-list');
  container.innerHTML = '';

  const entries = files.filter(
    (f) => !/^(\.\.|\[?parent\s*directory\]?|name|size|last\s*modified)$/iu.test(f.name)
      && (showDotfiles || !f.name.startsWith('.')),
  );

  let dirs = 0;
  let docs = 0;
  for (const entry of entries) {
    if (entry.url.endsWith('/')) dirs++;
    else docs++;
  }

  const count = document.createElement('div');
  count.className = 'dir-count';
  count.textContent = `${dirs + docs} item${dirs + docs === 1 ? '' : 's'}  ·  ${dirs} dir${dirs === 1 ? '' : 's'}, ${docs} file${docs === 1 ? '' : 's'}`;
  container.append(count);

  for (const file of entries) {
    const link = document.createElement('a');
    link.className = 'file-link';
    const isDir = file.url.endsWith('/');
    link.textContent = (isDir ? '📁 ' : '📄 ') + file.name;
    link.href = '#';
    link.dataset.url = file.url;
    link.dataset.date = file.date;
    link.addEventListener('click', onFileClick);

    container.append(link);
  }
}

async function onFileClick(e) {
  e.preventDefault();
  const link = e.currentTarget;
  lastClickedFile = { url: link.dataset.url, date: link.dataset.date };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.update(tab.id, { url: link.dataset.url });
  }
}

function inspectFileMetadata() {
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
        dateElem.dataset.date ||
        null;
    }
  }

  if (info.size === null && document.body && document.body.innerText) {
    info.size = new Blob([document.body.innerText]).size;
  }

  if (info.size === null) {
    const resources = performance.getEntriesByType('resource');
    for (const res of resources) {
      if (res.transferSize) {
        info.size = res.transferSize;
        break;
      }
    }
  }

  if (info.size === null) {
    const navInfo = performance.getEntriesByType('navigation')[0];
    if (navInfo) {
      info.size = navInfo.transferSize || navInfo.encodedBodySize || null;
    }
  }

  return info;
}
function renderMetadataBasics(url, content) {
  const cleanPath = decodeURIComponent(url.replace('file://', ''));
  const fileName = cleanPath.split('/').pop();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const mimeTypes = {
    // Images
    avif: 'image/avif', bmp: 'image/bmp', gif: 'image/gif',
    ico: 'image/vnd.microsoft.icon', jpeg: 'image/jpeg', jpg: 'image/jpeg',
    png: 'image/png', svg: 'image/svg+xml', tif: 'image/tiff',
    tiff: 'image/tiff', webp: 'image/webp',

    // Documents
    csv: 'text/csv', css: 'text/css', html: 'text/html', htm: 'text/html',
    json: 'application/json', less: 'text/x-less', mdx: 'text/mdx',
    py: 'text/x-python', rtf: 'application/rtf', sass: 'text/x-sass',
    scss: 'text/x-scss', sh: 'application/x-sh', toml: 'application/toml',
    txt: 'text/plain', xml: 'application/xml', yaml: 'text/yaml',
    yml: 'text/yaml',

    // Code / Scripts
    cjs: 'application/javascript', js: 'application/javascript',
    jsx: 'text/jsx', mjs: 'application/javascript', ts: 'text/typescript',
    tsx: 'text/typescript', vue: 'text/x-vue',

    // Markup
    md: 'text/markdown', pdf: 'application/pdf',

    // Archives
    '7z': 'application/x-7z-compressed', bz2: 'application/x-bzip2',
    gz: 'application/gzip', rar: 'application/vnd.rar',
    tar: 'application/x-tar', xz: 'application/x-xz',
    zip: 'application/zip',

    // Video
    avi: 'video/x-msvideo', mkv: 'video/x-matroska', mov: 'video/quicktime',
    mp4: 'video/mp4', webm: 'video/webm',

    // Audio
    aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4',
    mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/opus',
    wav: 'audio/wav',

    // Office
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ods: 'application/vnd.oasis.opendocument.spreadsheet', odt: 'application/vnd.oasis.opendocument.text',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    // Fonts
    eot: 'application/vnd.ms-fontobject', otf: 'font/otf',
    ttf: 'font/ttf', woff: 'font/woff', woff2: 'font/woff2',

    // Other
    env: 'application/x-env', iso: 'application/x-iso9660-image',
    lock: 'application/json', map: 'application/json', wasm: 'application/wasm',
  };
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  const fileDate = lastClickedFile?.date || '';

  content.innerHTML = `
    <div class="meta-row"><strong>Path:</strong> <code>${cleanPath}</code></div>
    <div class="meta-row"><strong>Name:</strong> ${fileName}</div>
    <div class="meta-row"><strong>Type:</strong> ${mimeType}</div>
    ${fileDate ? `<div class="meta-row"><strong>Modified:</strong> ${fileDate}</div>` : ''}
  `;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function renderMetadataExtra(content, { size, width, height, date }) {
  if (width && height) {
    content.innerHTML += `<div class="meta-row"><strong>Dimensions:</strong> ${width} x ${height}</div>`;
  }

  if (size) {
    content.innerHTML += `<div class="meta-row"><strong>Size:</strong> ${formatSize(size)}</div>`;
  }

  if (date) {
    content.innerHTML += `<div class="meta-row"><strong>Modified:</strong> ${date}</div>`;
  }
}

async function showMetadataForUrl(url) {
  const container = document.querySelector('#file-list');
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'meta-header';
  header.textContent = 'Quick Info';
  container.append(header);

  const content = document.createElement('div');
  content.id = 'meta-content';
  container.append(content);

  renderMetadataBasics(url, content);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: inspectFileMetadata,
    });

    if (result && result[0] && result[0].result) {
      renderMetadataExtra(content, result[0].result);
    }
  } catch (err) {
    console.error(err);
  }
}

document.querySelector('#back-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.startsWith('file:///')) {
    try { await chrome.tabs.goBack(tab.id); } catch (err) { console.error(err); }
  }
});
document.querySelector('#fwd-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.startsWith('file:///')) {
    try { await chrome.tabs.goForward(tab.id); } catch (err) { console.error(err); }
  }
});
document.querySelector('#home-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.startsWith('file:///')) {
    const parts = new URL(tab.url).pathname.replace(/\/$/u, '').split('/');
    if (parts.length >= 3 && ['home', 'Users'].includes(parts[1])) {
      chrome.tabs.update(tab.id, { url: `file:///${parts[1]}/${parts[2]}/` });
    } else {
      chrome.tabs.update(tab.id, { url: 'file:///' });
    }
  }
});
document.querySelector('#dotfiles-btn').addEventListener('click', () => {
  showDotfiles = !showDotfiles;
  document.querySelector('#dotfiles-btn').classList.toggle('active', showDotfiles);
  syncWithTab();
});
