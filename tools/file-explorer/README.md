# File Explorer

A Chrome extension that provides a file explorer side panel for browsing local files.

## Features

- Displays files and folders from the current directory in a side panel
- Click on folders to navigate into them
- Click on files to view their metadata in the side panel
- Shows file information: path, name, type, size, modified date, and dimensions (for images)
- Home and Back navigation buttons
- Auto-updates when switching tabs or navigating

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `tools/file-explorer` directory

## Usage

1. Click the extension icon to open the side panel
2. Navigate to a local folder in the main Chrome tab (e.g., `file:///home/rsp/`)
3. Browse files and folders using the side panel
4. Click on any file to see its metadata displayed in the side panel

## Permissions

- `sidePanel` - Required to show the side panel
- `tabs` - Required to query and update tabs
- `scripting` - Required to execute scripts in tab context
- `file:///*` - Required to access local files

## File Structure

```
file-explorer/
├── manifest.json      # Extension manifest
├── background.js      # Service worker for side panel behavior
├── sidepanel/
│   ├── index.html     # Side panel HTML
│   ├── index.js       # Side panel logic
│   └── index.css      # Side panel styles
└── README.md          # This file
```
