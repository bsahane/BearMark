# BearMark - Chrome Extension New Tab Markdown Editor

A beautiful Bear.app-inspired markdown editor that replaces your Chrome new tab page with a powerful, unified writing experience.

## 🎯 Features

### ✅ Chrome Extension
- **New Tab Replacement**: Beautiful markdown editor appears on every new tab
- **Manifest V3**: Latest Chrome extension standards with enhanced security
- **Offline First**: Works completely offline with Chrome's local storage
- **No External Dependencies**: Self-contained with no internet requirements

### ✅ Core Editing Experience  
- **Unified Editor**: Single editing view with real-time markdown rendering overlay (like Bear.app/marktwo.app)
- **Perfect Cursor Alignment**: Cursor position matches rendered content exactly across all markdown elements
- **Auto-save**: Automatic note saving while typing
- **Search**: Full-text search across all notes and tags
- **Export**: Download notes as markdown files

### ✅ Markdown Support
- **Headers**: `# ## ### ####` with real-time styling and perfect cursor alignment
- **Bold**: `**text**` and `__text__` with inline formatting  
- **Italic**: `*text*` and `_text_` with inline formatting
- **Inline Code**: `` `code` `` with syntax highlighting
- **Links**: `[text](url)` with clickable links (Cmd/Ctrl + Click)
- **Hashtags**: `#tag` with clickable search functionality (Cmd/Ctrl + Click)
- **Lists**: `- item` and `1. item` with bullet formatting
- **Checkboxes**: `[ ] task` and `[x] completed` with interactive checkboxes  
- **Blockquotes**: `> quote` with visual indicators
- **Horizontal Rules**: `---` with full-width lines and perfect cursor alignment

### ✅ Advanced Features
- **Today's Date Header**: New notes automatically start with today's date in bold red
- **Collapsible Sidebars**: Both note list and calendar sidebars collapse/expand with state persistence
- **Blur Privacy Mode**: Blur content when not focused for privacy (configurable)
- **Smart Calendar**: Realistic today's events based on time and day of week
- **Settings Modal**: Comprehensive settings panel for all preferences

### ✅ User Experience
- **Bear.app UI**: Clean, minimal interface with warm color palette
- **Keyboard Shortcuts**: 
  - `Cmd/Ctrl + N`: New note
  - `Cmd/Ctrl + S`: Manual save
  - `Cmd/Ctrl + F`: Focus search  
  - `Cmd/Ctrl + B`: Bold text
  - `Cmd/Ctrl + I`: Italic text
  - `Cmd/Ctrl + K`: Insert link `[]()`
  - `Cmd/Ctrl + E`: Export note
  - `Cmd/Ctrl + ,`: Open settings (planned)

### ✅ Technical Architecture
- **Frontend**: Vanilla JavaScript + Tailwind CSS (no frameworks)
- **Storage**: Chrome Storage API with automatic sync
- **Build**: Vite for CSS compilation and asset management  
- **Security**: Content Security Policy compliant (Manifest V3)
- **Performance**: Optimized for instant loading on new tab

## 🚀 Installation

### Method 1: From Source (Recommended)

1. **Clone Repository**:
   ```bash
   git clone https://github.com/bsahane/BearMark.git
   cd bappa-project
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build Extension**:
   ```bash
   ./build-extension.sh
   ```

4. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `extension/` folder
   - Open a new tab to see BearMark!

### Method 2: Pre-built Extension

1. Download the latest release from [GitHub Releases](https://github.com/bsahane/BearMark/releases)
2. Extract the `.zip` file  
3. Follow steps 4 from Method 1

## ⚙️ Settings

Access settings via the gear icon in the header:

### Calendar Settings
- **Show Calendar Sidebar**: Toggle the right sidebar with today's realistic events
- **Calendar Connection**: Information about calendar integration status

### Editor Settings  
- **Auto-Save**: Automatically save notes while typing (recommended: enabled)
- **Blur Content**: Blur notes when not focused for privacy (useful in public spaces)

### Additional Options
- **Reset to Defaults**: Restore all settings to default values
- **Save Settings**: Manually save current preferences (auto-saved by default)

## 📝 Writing with BearMark

### Getting Started
1. **Create First Note**: Click the "+" button or "Create Your First Note"
2. **Daily Header**: Each new note starts with today's date in bold red
3. **Start Writing**: The editor behaves like a standard text area with live markdown preview

### Markdown Examples
```markdown
**Monday, January 15, 2024**

# Meeting Notes
## Project Discussion
- [x] Review requirements  
- [ ] Update timeline
- [ ] Schedule follow-up

> Important: Remember to update the #roadmap before Friday

Check out [our documentation](https://example.com) for more details.

---

### Next Steps
1. Implement new features
2. Test thoroughly  
3. Deploy to production
```

### Hashtag Organization
- Type `#projectname` to create tags
- Cmd/Ctrl + Click on any hashtag to search all notes with that tag  
- Use tags for organizing: `#meeting`, `#ideas`, `#personal`, `#work`

### Link Management
- Type `[Link Text](https://example.com)` for links
- Cmd/Ctrl + K to insert link template
- Cmd/Ctrl + Click to open links in new tab

## 🎨 Design Philosophy

BearMark follows Bear.app's design principles:

- **Writing First**: Distraction-free environment focused on writing
- **Unified Experience**: No separate preview mode - see results as you type
- **Beautiful Typography**: Carefully chosen fonts and spacing for readability  
- **Warm Color Palette**: Easy on the eyes with warm grays and accent red
- **Fast & Local**: Everything stored locally for instant access and privacy

## 🔧 Technical Details

### Unified Editor Implementation
The unified editor overlays a transparent textarea on top of rendered HTML:

- **Perfect Alignment**: CSS properties ensure identical text metrics between input and display  
- **Scroll Synchronization**: Input and display scroll positions stay perfectly matched
- **Real-time Parsing**: Markdown is parsed on every keystroke with debounced rendering
- **Cursor Precision**: Special handling for headers, horizontal rules, and other block elements

### Chrome Storage Integration
- **Automatic Sync**: Settings and notes sync across Chrome instances
- **Efficient Updates**: Only changed data is stored to minimize storage usage
- **Fallback Support**: localStorage fallback for development and testing
- **Storage Monitoring**: Built-in storage usage tracking

### Calendar System  
- **Realistic Events**: Generated events based on current time and day of week
- **Smart Scheduling**: Different events for weekdays vs weekends
- **Time-Aware**: Past events show as completed, upcoming events are highlighted
- **No Authentication**: Works instantly without requiring Google account setup

## 📁 Project Structure

```
extension/
├── manifest.json              # Chrome extension configuration
├── newtab-vanilla.html        # Main new tab page HTML
├── js/
│   ├── vanilla-app.js         # Main application logic
│   ├── storage.js             # Chrome Storage API wrapper
│   ├── calendar.js            # Calendar event generation
│   └── marked.min.js          # Markdown parser library
├── styles/
│   └── compiled.css           # Compiled Tailwind CSS
└── icons/                     # Extension icons (16x16 to 128x128)

src/
├── style.css                  # Source Tailwind CSS with custom styles
└── (development files)

build-extension.sh             # Build script for extension
package.json                   # Node.js dependencies and scripts
```

## 🔒 Privacy & Security

- **Local First**: All data stays on your device
- **No Analytics**: No tracking, no data collection, no external requests
- **Secure**: Content Security Policy prevents code injection  
- **Optional Blur**: Hide content when not focused for shoulder surfing protection
- **Open Source**: Full source code available for audit

## 🚀 Development  

### Prerequisites
- Node.js 16+ and npm
- Google Chrome browser

### Development Setup
```bash
# Clone and setup
git clone https://github.com/bsahane/BearMark.git
cd bappa-project
npm install

# Development with hot reload
npm run dev

# Build for production  
npm run build

# Build extension
./build-extension.sh

# Test (planned)
npm run test
```

### Architecture Decisions
- **Vanilla JavaScript**: No frameworks for maximum performance and minimal size
- **Chrome Storage**: Better than localStorage for extension sync across devices  
- **Tailwind CSS**: Utility-first CSS for rapid development and consistent design
- **Vite**: Fast build tool for CSS compilation and asset optimization

## 🛣️ Roadmap

### Phase 1: Core Stability ✅
- [x] Chrome Extension implementation
- [x] Unified editor with perfect cursor alignment  
- [x] Complete settings system
- [x] Calendar sidebar with realistic events
- [x] All essential markdown features

### Phase 2: Enhanced Features (Planned)
- [ ] Import/Export functionality for data portability
- [ ] Advanced search with filters and sorting  
- [ ] Custom themes and color schemes
- [ ] Keyboard shortcut customization
- [ ] Note templates and quick inserts

### Phase 3: Advanced (Future)
- [ ] Optional cloud backup (Google Drive, Dropbox)
- [ ] Collaboration features with shared notes
- [ ] Plugin system for extensions
- [ ] Mobile companion app
- [ ] Real Google Calendar integration (optional)

## 🤝 Contributing  

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly  
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bear.app**: Inspiration for the beautiful, unified editing experience
- **marktwo.app**: Reference for perfect cursor alignment techniques  
- **Tailwind CSS**: Excellent utility-first CSS framework
- **Marked.js**: Fast, reliable markdown parser

---

**BearMark** - Transform your new tab into a beautiful writing space. ✨

Made with ❤️ for writers who value simplicity, beauty, and performance.