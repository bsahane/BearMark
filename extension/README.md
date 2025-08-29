# 🚀 BearMark Chrome Extension

Transform your new tab page into a beautiful markdown editor with BearMark! Every time you open a new tab, you'll have instant access to your notes with a Bear.app-like editing experience.

## ✨ Features

- 🆕 **New Tab Replacement**: BearMark becomes your new tab page
- 📝 **Live Markdown Editing**: Real-time markdown rendering while you type
- 🔗 **Clickable Links**: Cmd+Click / Ctrl+Click to open links
- 🏷️ **Hashtag Support**: Cmd+Click / Ctrl+Click to filter by hashtags
- ⚡ **Auto Formatting**: 
  - `- ` for auto bullet points
  - `[ ] ` for checkboxes
  - Smart table navigation with Tab
- 🔧 **Table Editor**: Full table editing with keyboard shortcuts
- 📁 **Collapsible Sidebar**: Space-saving sidebar toggle
- 💾 **Chrome Storage**: Your notes sync across Chrome instances
- 📤 **Export/Import**: Backup and restore your notes

## 🛠️ Installation

### Method 1: Developer Mode (Recommended for now)

1. **Download the Extension**:
   ```bash
   # Clone or download the project
   cd extension/
   ```

2. **Open Chrome Extensions**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

3. **Load Extension**:
   - Click "Load unpacked"
   - Select the `extension/` folder
   - BearMark will be installed!

4. **Test Installation**:
   - Open a new tab (Cmd+T / Ctrl+T)
   - You should see BearMark instead of the default new tab

### Method 2: Chrome Web Store (Coming Soon)
*The extension will be published to Chrome Web Store after testing.*

## 📋 Requirements

- Chrome Browser 88+ (Manifest V3 support)
- Chrome Extensions enabled
- ~5MB storage space

## 🎮 How to Use

### Basic Usage
1. **Open New Tab**: Press `Cmd+T` / `Ctrl+T`
2. **Create Note**: Click "Create Your First Note" or the `+` button
3. **Start Writing**: Begin typing markdown in the editor
4. **Auto-Save**: Notes save automatically as you type

### Keyboard Shortcuts

#### Text Formatting
- `Cmd+B` / `Ctrl+B` - **Bold text**
- `Cmd+I` / `Ctrl+I` - *Italic text*
- `Cmd+K` / `Ctrl+K` - [Create link](url)

#### Lists & Checkboxes
- `- ` + `Space` - Auto bullet points
- `[ ] ` + `Space` - Auto checkboxes
- `Enter` - Continue list/checkbox
- `Enter` on empty item - Exit list mode

#### Table Navigation
- `Tab` - Next cell
- `Shift+Tab` - Previous cell
- `Alt+→` - Move column right
- `Alt+←` - Move column left
- `Alt+↑` - Move row up
- `Alt+↓` - Move row down
- `Alt+Shift+→` - Insert column
- `Alt+Shift+←` - Delete column
- `Alt+Shift+↓` - Insert row
- `Alt+Shift+↑` - Delete row

#### Interactive Elements
- `Cmd+Click` / `Ctrl+Click` on links - Open in new tab
- `Cmd+Click` / `Ctrl+Click` on hashtags - Filter notes

### Advanced Features

#### Sidebar
- Click the **☰** button to collapse/expand sidebar
- Search notes using the search box
- Click any note to switch to it

#### Data Management
- **Export**: Click extension icon → "Export Notes"
- **Import**: Use exported JSON file to restore notes
- **Storage**: Notes are stored locally in Chrome

## 🔧 Customization

### Settings (Coming Soon)
- Theme selection (Light/Dark)
- Font size adjustment
- Auto-save intervals
- Export formats

### Permissions Explained
- **Storage**: To save your notes locally
- **ActiveTab**: To handle new tab replacement
- **Downloads**: For exporting notes

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Check if Developer Mode is enabled
   - Refresh the extension page
   - Try reloading the extension

2. **New Tab Not Replaced**:
   - Check if another extension is overriding new tab
   - Disable conflicting extensions
   - Restart Chrome

3. **Notes Not Saving**:
   - Check Chrome storage permissions
   - Try refreshing the new tab page
   - Check browser console for errors

4. **Keyboard Shortcuts Not Working**:
   - Ensure focus is in the editor textarea
   - Check for conflicting browser shortcuts
   - Try clicking in the editor first

### Debug Mode
Open Developer Tools (`F12`) on the new tab page to see console logs and debug information.

## 📊 Performance

- **Lightweight**: ~2MB extension size
- **Fast Loading**: Optimized for quick new tab opens
- **Efficient Storage**: Compressed note storage
- **Memory Usage**: Minimal impact on browser performance

## 🔒 Privacy & Security

- **Local Storage**: All data stays on your device
- **No Tracking**: No analytics or tracking
- **No Network**: Works completely offline
- **Secure**: Content Security Policy enforced

## 🔄 Updates

### Auto-Updates
When published to Chrome Web Store, updates will be automatic.

### Manual Updates (Developer Mode)
1. Download latest version
2. Go to `chrome://extensions/`
3. Click "Reload" on BearMark extension

## 📁 File Structure

```
extension/
├── manifest.json          # Extension configuration
├── newtab.html            # New tab page
├── popup.html             # Extension popup
├── background.js          # Service worker
├── popup.js               # Popup functionality
├── js/
│   ├── app.js            # Main application logic
│   └── storage.js        # Chrome storage adapter
├── styles/
│   └── style.css         # Application styles
├── icons/
│   ├── icon-16.png       # Extension icons
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md             # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes in `extension/` folder
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - See main project LICENSE file

## 🆘 Support

- **Issues**: Report bugs in GitHub Issues
- **Feedback**: Share suggestions and improvements
- **Documentation**: Help improve this README

---

**Enjoy your beautiful markdown editing experience with BearMark! 🐻📝**
