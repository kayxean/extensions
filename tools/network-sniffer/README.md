# Network Sniffer

A Chrome extension that captures and displays HTTP network requests (XHR/Fetch) in a side panel.

## Features

- Captures XHR network requests in real-time
- Displays request method, URL, and timestamp
- Shows last 50 requests with most recent at top
- Persistent storage of request history across sessions
- Clear logs button to reset captured requests

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `tools/network-sniffer` directory

## Usage

1. Click the extension icon to open the side panel
2. Navigate to any website in the main Chrome tab
3. Watch network requests appear in the side panel in real-time
4. Click "Clear Logs" to reset the captured requests

## Permissions

- `sidePanel` - Required to show the side panel
- `webRequest` - Required to intercept network requests
- `storage` - Required to persist request history
- `<all_urls>` - Required to capture requests from all websites

## File Structure

```
network-sniffer/
├── manifest.json      # Extension manifest
├── background.js      # Service worker for capturing network requests
├── sidepanel/
│   ├── index.html     # Side panel HTML
│   ├── index.js       # Side panel logic
│   └── index.css      # Side panel styles
└── README.md          # This file
```
