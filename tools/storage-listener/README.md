# Storage Listener

A Chrome extension that monitors and displays browser storage changes (localStorage, sessionStorage, and cookies) in a side panel.

## Features

- Monitors localStorage changes in real-time
- Monitors sessionStorage changes in real-time
- Monitors cookie changes in real-time
- Displays all storage types in a single feed with category labels
- Shows old and new values when storage items are modified
- Freeze and clear controls for the feed

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `tools/storage-listener` directory

## Usage

1. Click the extension icon to open the side panel
2. Navigate to any website in the main Chrome tab
3. Watch storage events appear in the side panel in real-time
4. Click "Clear Log" to reset the displayed storage data
5. Check "Freeze Feed" to pause updates

## Permissions

- `sidePanel` - Required to show the side panel
- `tabs` - Required to query and update tabs
- `scripting` - Required to execute scripts in tab context
- `cookies` - Required to monitor cookie changes
- `<all_urls>` - Required to access all websites

## File Structure

```
storage-listener/
├── manifest.json      # Extension manifest
├── background.js      # Service worker for storage monitoring
├── sidepanel/
│   ├── index.html     # Side panel HTML
│   ├── index.js       # Side panel logic
│   └── index.css      # Side panel styles
└── README.md          # This file
```
