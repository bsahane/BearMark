# BearMark - Beautiful Markdown Editor

A Bear.app-inspired single-page markdown editor with real-time unified editing experience.

## 🎯 Features Completed

### ✅ Core Functionality
- **Unified Editor**: Single editing view with real-time markdown rendering overlay (like Bear.app)
- **Perfect Cursor Alignment**: Cursor position matches rendered content exactly
- **Local Storage**: SQLite-ready database layer with localStorage fallback
- **Auto-save**: Automatic note saving with debounced updates
- **Search**: Full-text search across all notes
- **Export**: Download notes as markdown files

### ✅ Markdown Support
- **Headers**: `# ## ### ####` with real-time styling
- **Bold**: `**text**` with inline formatting
- **Italic**: `*text*` with inline formatting  
- **Inline Code**: `` `code` `` with syntax highlighting
- **Links**: `[text](url)` with link styling
- **Lists**: `* item` and `1. item` with bullet formatting
- **Blockquotes**: `> quote` with visual indicators

### ✅ Table Support (NEW!)
- **Table Parsing**: Full markdown table support with headers, alignment, and data rows
- **Auto-formatting**: Type `|` to auto-complete table separators
- **Keyboard Shortcut**: `Cmd/Ctrl + T` to insert table template
- **Bear.app Styling**: Beautiful table design with hover effects and proper alignment
- **Responsive**: Tables adapt to different screen sizes

### ✅ User Experience
- **Bear.app UI**: Clean, minimal interface inspired by Bear.app
- **Daily Inspiration**: Motivational prompts for writers
- **Keyboard Shortcuts**: 
  - `Cmd/Ctrl + N`: New note
  - `Cmd/Ctrl + S`: Save note
  - `Cmd/Ctrl + F`: Focus search
  - `Cmd/Ctrl + B`: Bold text
  - `Cmd/Ctrl + I`: Italic text
  - `Cmd/Ctrl + K`: Insert link
  - `Cmd/Ctrl + T`: Insert table
  - `Cmd/Ctrl + E`: Export note

### ✅ Technical Architecture
- **Frontend**: Vite + Alpine.js + Tailwind CSS
- **Database**: Local storage with SQLite.js integration ready
- **Testing**: Vitest test framework setup
- **Performance**: Optimized with code splitting and lazy loading

## 📝 Table Usage

### Creating Tables
1. **Keyboard Shortcut**: Press `Cmd/Ctrl + T` to insert a table template
2. **Manual Creation**: Type markdown table syntax:
   ```markdown
   | Header 1 | Header 2 | Header 3 |
   |----------|----------|----------|
   | Cell 1   | Cell 2   | Cell 3   |
   | Cell 4   | Cell 5   | Cell 6   |
   ```

### Table Features
- **Alignment**: Use `:---:` for center, `---:` for right alignment
- **Auto-completion**: Type `|` on separator rows for auto-formatting
- **Real-time Rendering**: Tables render immediately as you type
- **Responsive Design**: Tables scroll horizontally on mobile devices

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Run Tests**:
   ```bash
   npm run test
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## 🎨 Design Philosophy

BearMark follows Bear.app's design principles:
- **Simplicity**: Focus on writing, not features
- **Beauty**: Clean, minimal interface
- **Performance**: Fast, responsive, local-first
- **Unified Experience**: Single editor view with real-time rendering

## 🔧 Technical Details

### Unified Editor Implementation
The unified editor uses a transparent textarea overlaid with a rendered HTML preview. This provides:
- **Perfect cursor alignment** between input and display
- **Real-time markdown rendering** without mode switching
- **Consistent typing experience** with immediate visual feedback
- **Bear.app-like editing flow** with subtle markdown syntax highlighting

### Table Rendering Engine
Tables are parsed from markdown syntax and rendered as HTML with:
- **Header detection** with automatic styling
- **Alignment parsing** from separator row syntax
- **Responsive design** with horizontal scrolling
- **Hover effects** for better user interaction

## 📁 Project Structure

```
src/
├── index.html          # Main application HTML
├── style.css           # Tailwind CSS + custom styles
├── js/
│   ├── app.js          # Main Alpine.js application
│   ├── database.js     # Database abstraction layer
│   └── markdown.js     # Markdown processing utilities
└── basic.test.js       # Test suite

.agent-os/
└── product/
    ├── mission.md      # Product vision and features
    ├── mission-lite.md # Condensed mission
    ├── tech-stack.md   # Technical architecture
    └── roadmap.md      # Development roadmap
```

## 🎯 Next Steps

The foundation is complete! Future enhancements could include:
- **SQLite Integration**: Replace localStorage with full SQLite database
- **Cloud Sync**: Optional cloud backup and sync
- **Collaboration**: Real-time collaborative editing
- **Plugin System**: Extensible architecture
- **Mobile App**: Native mobile companion

---

**BearMark** - Where beautiful writing begins. ✨
