// Vanilla JavaScript BearMark Application for Chrome Extension
class BearMarkApp {
    constructor() {
        this.notes = [];
        this.filteredNotes = [];
        this.selectedNote = null;
        this.searchQuery = '';
        this.sidebarCollapsed = false;
        this.isLoading = true;
        this.autoSaveTimer = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.render = this.render.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        
        console.log('🎯 BearMarkApp class instantiated');
    }

    async init() {
        console.log('🚀 BearMark init() called');
        try {
            this.isLoading = true;
            
            // Initialize storage
            if (window.bearmarkDB) {
                console.log('💾 Database found, loading notes...');
                await this.loadNotes();
                console.log('📝 Notes loaded:', this.notes.length);
            } else {
                console.error('❌ Database not found!');
            }
            
            this.isLoading = false;
            
            // Initial render
            this.render();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('🎉 BearMark initialized successfully');
        } catch (error) {
            console.error('💥 Error initializing app:', error);
            this.isLoading = false;
        }
    }

    async loadNotes() {
        try {
            this.notes = await window.bearmarkDB.getAllNotes();
            this.filteredNotes = [...this.notes];
            
            // Select first note if available
            if (this.notes.length > 0 && !this.selectedNote) {
                this.selectedNote = this.notes[0];
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
            this.filteredNotes = [];
        }
    }

    async createNewNote() {
        console.log('📝 Creating new note...');
        try {
            // Get today's date and day
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateString = today.toLocaleDateString('en-US', options);
            
            const note = {
                title: 'Untitled Note',
                content: `**${dateString}**\n\n`,
                tags: []
            };
            
            const created = await window.bearmarkDB.createNote(note);
            this.notes.unshift(created);
            this.selectedNote = created;
            this.filteredNotes = [...this.notes];
            
            this.render();
            
            // Focus title input
            setTimeout(() => {
                const titleInput = document.getElementById('note-title');
                if (titleInput) {
                    titleInput.focus();
                    titleInput.select();
                }
            }, 100);
            
            console.log('✅ Note created:', created.id);
        } catch (error) {
            console.error('Error creating note:', error);
        }
    }

    async saveNote() {
        if (!this.selectedNote) return;
        
        // Clear existing timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Set new timer for auto-save
        this.autoSaveTimer = setTimeout(async () => {
            try {
                const updated = await window.bearmarkDB.updateNote(this.selectedNote.id, this.selectedNote);
                
                // Update local notes array
                const noteIndex = this.notes.findIndex(n => n.id === this.selectedNote.id);
                if (noteIndex !== -1) {
                    this.notes[noteIndex] = { ...this.selectedNote };
                    this.filterNotes();
                    this.renderNotesList();
                }
                
                console.log('💾 Note saved automatically');
            } catch (error) {
                console.error('Error saving note:', error);
            }
        }, 500);
    }

    async deleteNote(note) {
        if (!note || !confirm('Are you sure you want to delete this note?')) return;
        
        try {
            await window.bearmarkDB.deleteNote(note.id);
            
            // Remove from local arrays
            this.notes = this.notes.filter(n => n.id !== note.id);
            this.filteredNotes = this.filteredNotes.filter(n => n.id !== note.id);
            
            // Select another note or clear selection
            if (this.selectedNote && this.selectedNote.id === note.id) {
                this.selectedNote = this.notes.length > 0 ? this.notes[0] : null;
            }
            
            this.render();
            console.log('🗑️ Note deleted:', note.id);
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    }

    selectNote(note) {
        this.selectedNote = note;
        this.render();
        
        // Focus editor
        setTimeout(() => {
            const textarea = document.getElementById('editor-textarea');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    }

    filterNotes() {
        if (!this.searchQuery.trim()) {
            this.filteredNotes = [...this.notes];
        } else {
            const query = this.searchQuery.toLowerCase();
            this.filteredNotes = this.notes.filter(note =>
                note.title.toLowerCase().includes(query) ||
                note.content.toLowerCase().includes(query)
            );
        }
        this.renderNotesList();
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        const sidebar = document.getElementById('sidebar');
        const title = document.getElementById('sidebar-title');
        const searchContainer = document.getElementById('search-container');
        const notesContainer = document.getElementById('notes-container');
        const newNoteBtn = document.getElementById('new-note-btn');
        
        if (this.sidebarCollapsed) {
            sidebar.className = sidebar.className.replace('w-80', 'w-16');
            title.style.display = 'none';
            searchContainer.style.display = 'none';
            notesContainer.style.display = 'none';
            newNoteBtn.style.display = 'none';
        } else {
            sidebar.className = sidebar.className.replace('w-16', 'w-80');
            title.style.display = 'block';
            searchContainer.style.display = 'block';
            notesContainer.style.display = 'block';
            newNoteBtn.style.display = 'block';
        }
    }

    updateEditor() {
        if (!this.selectedNote) return;
        
        const textarea = document.getElementById('editor-textarea');
        const content = document.getElementById('editor-content');
        
        if (!textarea || !content) return;
        
        // Update textarea value if different
        if (textarea.value !== this.selectedNote.content) {
            textarea.value = this.selectedNote.content;
        }
        
        // Render markdown
        try {
            const rendered = this.renderMarkdown(this.selectedNote.content);
            content.innerHTML = rendered;
        } catch (error) {
            console.error('Error rendering markdown:', error);
            content.innerHTML = '<p class="text-red-500">Error rendering content</p>';
        }
    }

    renderMarkdown(text) {
        if (!text || text.trim() === '') {
            return '';
        }

        // Process line by line to maintain cursor alignment like the main app
        const lines = text.split('\n');
        const processedLines = lines.map(line => {
            let processedLine = line;
            
            // Headers - maintain line height for cursor alignment, only change font weight and color
            if (/^### /.test(line) && !/^###\w/.test(line)) {
                const text = line.replace(/^### /, '');
                return `<span class="text-warm-400">### </span><span class="font-medium text-warm-700">${text}</span>`;
            } else if (/^## /.test(line) && !/^##\w/.test(line)) {
                const text = line.replace(/^## /, '');
                return `<span class="text-warm-400">## </span><span class="font-semibold text-warm-800">${text}</span>`;
            } else if (/^# /.test(line) && !/^#\w/.test(line)) {
                const text = line.replace(/^# /, '');
                return `<span class="text-warm-400"># </span><span class="font-bold text-warm-900">${text}</span>`;
            }
            
            // Bold and italic - make date headers dark red
            processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, (match, content) => {
                // Check if this looks like a date (contains day name and year)
                if (/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*\d{4}\b/.test(content)) {
                    return `<strong class="font-semibold text-red-700">${content}</strong>`;
                }
                return `<strong class="font-semibold">${content}</strong>`;
            });
            processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
            
            // Code
            processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-warm-100 text-bear-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
            
            // Links - keep the markdown syntax visible with proper styling
            processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="text-red-700 underline cursor-pointer" onclick="return app.handleLinkClick(event, \'$2\')">[<span class="text-red-700">$1</span>]</span><span class="text-warm-500">($2)</span>');
            
            // Hashtags - style them but don't convert to headers, make them Cmd+Click searchable
            processedLine = processedLine.replace(/#(\w+)/g, '<span class="text-red-700 font-medium cursor-pointer underline" onclick="return app.handleHashtagClick(event, \'$1\')">#$1</span>');
            
            // Bullet points
            if (/^[-*+] /.test(line)) {
                return processedLine.replace(/^[-*+] /, '<span class="text-red-700 font-bold">• </span>');
            }
            
            // Numbered lists
            if (/^\d+\. /.test(line)) {
                return processedLine.replace(/^(\d+)\. /, '<span class="text-red-700 font-bold">$1. </span>');
            }
            
            // Checkboxes
            if (/^\[ \] /.test(line)) {
                return processedLine.replace(/^\[ \] /, '<span class="text-bear-500 font-bold">☐ </span>');
            }
            
            if (/^\[x\] /i.test(line)) {
                return processedLine.replace(/^\[x\] /i, '<span class="text-green-600 font-bold">☑ </span>');
            }
            
            // Table rows - style all pipe characters consistently with dark red
            if (line.includes('|')) {
                return processedLine.replace(/\|/g, '<span class="text-red-700">|</span>');
            }
            
            // Blockquotes
            if (/^> /.test(line)) {
                return processedLine.replace(/^> /, '<span class="text-bear-400 font-bold">▍ </span><span class="italic text-warm-600">').replace(/$/, '</span>');
            }
            
            // Horizontal rules - three or more dashes with inline styling for cursor alignment
            if (/^---+\s*$/.test(line)) {
                const dashes = line.trim();
                return `<span class="horizontal-rule-inline text-warm-400">${dashes}</span>`;
            }
            
            return processedLine;
        });

        return processedLines.join('<br>');
    }

    render() {
        this.renderNotesList();
        this.renderEditor();
        this.renderHeader();
    }

    renderNotesList() {
        const container = document.getElementById('notes-container');
        if (!container) return;
        
        if (this.filteredNotes.length === 0) {
            container.innerHTML = `
                <div class="p-8 text-center">
                    <svg class="w-12 h-12 mx-auto mb-4 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-warm-500">No notes found</p>
                    <button onclick="app.createNewNote()" class="mt-2 text-bear-600 hover:text-bear-700 text-sm font-medium">
                        Create your first note
                    </button>
                </div>
            `;
            return;
        }
        
        const notesHtml = this.filteredNotes.map(note => {
            const isSelected = this.selectedNote && this.selectedNote.id === note.id;
            const selectedClass = isSelected ? 'bg-bear-50 border-r-2 border-bear-500' : '';
            const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
            
            return `
                <div onclick="app.selectNote(${JSON.stringify(note).replace(/"/g, '&quot;')})" 
                     class="p-4 border-b border-warm-100 cursor-pointer hover:bg-warm-50 transition-colors ${selectedClass}">
                    <h3 class="font-medium text-warm-900 mb-1 truncate">${note.title || 'Untitled'}</h3>
                    <p class="text-sm text-warm-600 line-clamp-2">${preview}</p>
                    <p class="text-xs text-warm-400 mt-2">${this.formatDate(note.updated_at || note.updatedAt)}</p>
                </div>
            `;
        }).join('');
        
        container.innerHTML = notesHtml;
    }

    renderEditor() {
        const unifiedEditor = document.getElementById('unified-editor');
        const welcomeMessage = document.getElementById('welcome-message');
        
        if (this.selectedNote) {
            unifiedEditor.style.display = 'flex';
            welcomeMessage.style.display = 'none';
            this.updateEditor();
        } else {
            unifiedEditor.style.display = 'none';
            welcomeMessage.style.display = 'flex';
        }
    }

    renderHeader() {
        const noteTitle = document.getElementById('note-title');
        const noNoteMessage = document.getElementById('no-note-message');
        const exportBtn = document.getElementById('export-btn');
        const deleteBtn = document.getElementById('delete-btn');
        
        if (this.selectedNote) {
            noteTitle.style.display = 'block';
            noteTitle.value = this.selectedNote.title || '';
            noNoteMessage.style.display = 'none';
            exportBtn.style.display = 'block';
            deleteBtn.style.display = 'block';
        } else {
            noteTitle.style.display = 'none';
            noNoteMessage.style.display = 'block';
            exportBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                return 'Today';
            } else if (diffDays === 2) {
                return 'Yesterday';
            } else if (diffDays <= 7) {
                return `${diffDays - 1} days ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'Unknown';
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // New note button
        const newNoteBtn = document.getElementById('new-note-btn');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', () => this.createNewNote());
        }
        
        // Welcome create button
        const welcomeCreateBtn = document.getElementById('welcome-create-btn');
        if (welcomeCreateBtn) {
            welcomeCreateBtn.addEventListener('click', () => this.createNewNote());
        }
        
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.filterNotes();
            });
        }
        
        // Note title input
        const noteTitle = document.getElementById('note-title');
        if (noteTitle) {
            noteTitle.addEventListener('input', (e) => {
                if (this.selectedNote) {
                    this.selectedNote.title = e.target.value;
                    this.saveNote();
                }
            });
        }
        
        // Editor textarea
        const editorTextarea = document.getElementById('editor-textarea');
        if (editorTextarea) {
            editorTextarea.addEventListener('input', (e) => {
                if (this.selectedNote) {
                    this.selectedNote.content = e.target.value;
                    this.updateEditor();
                    this.saveNote();
                }
            });
            
            // Handle keydown for auto bullet points and other features
            editorTextarea.addEventListener('keydown', (e) => {
                this.handleEditorKeydown(e);
            });
            
            // Sync scroll
            editorTextarea.addEventListener('scroll', () => {
                const content = document.getElementById('editor-content');
                if (content) {
                    content.scrollTop = editorTextarea.scrollTop;
                    content.scrollLeft = editorTextarea.scrollLeft;
                }
            });
        }
        
        // Delete button
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.selectedNote) {
                    this.deleteNote(this.selectedNote);
                }
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportNote());
        }
    }

    exportNote() {
        if (!this.selectedNote) return;
        
        try {
            const content = `# ${this.selectedNote.title}\n\n${this.selectedNote.content}`;
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.selectedNote.title || 'note'}.md`;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting note:', error);
        }
    }

    handleEditorKeydown(event) {
        const textarea = event.target;
        
        // Handle Enter key for auto bullet points and checkboxes
        if (event.key === 'Enter') {
            this.handleEnterKey(event, textarea);
        }
        
        // Handle keyboard shortcuts
        if (event.metaKey || event.ctrlKey) {
            switch (event.key) {
                case 'b':
                    event.preventDefault();
                    this.wrapText(textarea, '**', '**');
                    break;
                case 'i':
                    event.preventDefault();
                    this.wrapText(textarea, '*', '*');
                    break;
                case 'k':
                    event.preventDefault();
                    this.createLink(textarea);
                    break;
            }
        }
    }

    handleEnterKey(event, textarea) {
        const content = textarea.value;
        const cursorPos = textarea.selectionStart;
        
        // Find the current line
        const beforeCursor = content.substring(0, cursorPos);
        const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
        const currentLine = content.substring(currentLineStart, cursorPos);
        
        // Check for bullet points
        if (/^[-*+] /.test(currentLine)) {
            // If line is just the bullet point (empty), remove it
            if (currentLine.trim() === '-' || currentLine.trim() === '*' || currentLine.trim() === '+') {
                event.preventDefault();
                const newText = content.substring(0, currentLineStart) + content.substring(cursorPos);
                textarea.value = newText;
                textarea.selectionStart = textarea.selectionEnd = currentLineStart;
                
                if (this.selectedNote) {
                    this.selectedNote.content = newText;
                    this.updateEditor();
                    this.saveNote();
                }
                return;
            }
            
            // Otherwise, create new bullet point
            event.preventDefault();
            const newText = content.substring(0, cursorPos) + '\n- ' + content.substring(cursorPos);
            textarea.value = newText;
            textarea.selectionStart = textarea.selectionEnd = cursorPos + 3;
            
            if (this.selectedNote) {
                this.selectedNote.content = newText;
                this.updateEditor();
                this.saveNote();
            }
            return;
        }
        
        // Check for numbered lists
        const numberedMatch = currentLine.match(/^(\d+)\. /);
        if (numberedMatch) {
            // If line is just the number (empty), remove it
            if (currentLine.trim() === `${numberedMatch[1]}.`) {
                event.preventDefault();
                const newText = content.substring(0, currentLineStart) + content.substring(cursorPos);
                textarea.value = newText;
                textarea.selectionStart = textarea.selectionEnd = currentLineStart;
                
                if (this.selectedNote) {
                    this.selectedNote.content = newText;
                    this.updateEditor();
                    this.saveNote();
                }
                return;
            }
            
            // Otherwise, create next number
            event.preventDefault();
            const nextNumber = parseInt(numberedMatch[1]) + 1;
            const newText = content.substring(0, cursorPos) + `\n${nextNumber}. ` + content.substring(cursorPos);
            textarea.value = newText;
            textarea.selectionStart = textarea.selectionEnd = cursorPos + `\n${nextNumber}. `.length;
            
            if (this.selectedNote) {
                this.selectedNote.content = newText;
                this.updateEditor();
                this.saveNote();
            }
            return;
        }
        
        // Check for checkboxes
        if (/^\[ \] /.test(currentLine) || /^\[x\] /i.test(currentLine)) {
            // If line is just the checkbox (empty), remove it
            if (currentLine.trim() === '[ ]' || currentLine.trim() === '[x]') {
                event.preventDefault();
                const newText = content.substring(0, currentLineStart) + content.substring(cursorPos);
                textarea.value = newText;
                textarea.selectionStart = textarea.selectionEnd = currentLineStart;
                
                if (this.selectedNote) {
                    this.selectedNote.content = newText;
                    this.updateEditor();
                    this.saveNote();
                }
                return;
            }
            
            // Otherwise, create new checkbox
            event.preventDefault();
            const newText = content.substring(0, cursorPos) + '\n[ ] ' + content.substring(cursorPos);
            textarea.value = newText;
            textarea.selectionStart = textarea.selectionEnd = cursorPos + 5;
            
            if (this.selectedNote) {
                this.selectedNote.content = newText;
                this.updateEditor();
                this.saveNote();
            }
            return;
        }
    }

    wrapText(textarea, prefix, suffix) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const newText = textarea.value.substring(0, start) + prefix + selectedText + suffix + textarea.value.substring(end);
        
        textarea.value = newText;
        
        // Set cursor position
        if (selectedText.length === 0) {
            // No selection, place cursor between the wrappers
            textarea.selectionStart = textarea.selectionEnd = start + prefix.length;
        } else {
            // Had selection, select the wrapped text
            textarea.selectionStart = start;
            textarea.selectionEnd = end + prefix.length + suffix.length;
        }
        
        textarea.focus();
        
        // Update the note
        if (this.selectedNote) {
            this.selectedNote.content = newText;
            this.updateEditor();
            this.saveNote();
        }
    }

    createLink(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (selectedText.length > 0) {
            // If text is selected, wrap it in link format and focus on URL part
            const linkText = `[${selectedText}]()`;
            const newText = textarea.value.substring(0, start) + linkText + textarea.value.substring(end);
            textarea.value = newText;
            
            // Position cursor inside the () for URL input
            const urlPosition = start + selectedText.length + 3; // After [text](
            textarea.selectionStart = textarea.selectionEnd = urlPosition;
            
        } else {
            // No selection, create empty link and focus on link text
            const linkText = `[]()`;
            const newText = textarea.value.substring(0, start) + linkText + textarea.value.substring(start);
            textarea.value = newText;
            
            // Position cursor inside the [] for link text input
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
        
        textarea.focus();
        
        // Update the note
        if (this.selectedNote) {
            this.selectedNote.content = textarea.value;
            this.updateEditor();
            this.saveNote();
        }
    }

    filterByHashtag(hashtag) {
        this.searchQuery = `#${hashtag}`;
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = this.searchQuery;
        }
        this.filterNotes();
    }

    handleHashtagClick(event, hashtag) {
        // Handle Cmd+Click or Ctrl+Click to search
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            this.filterByHashtag(hashtag);
            return false;
        }
        
        // Normal click - still filter (for touch devices)
        this.filterByHashtag(hashtag);
        return false;
    }

    handleLinkClick(event, url) {
        // Handle Cmd+Click or Ctrl+Click to open in new tab
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            if (this.isValidUrl(url)) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return false;
        }
        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            // Try with https:// prefix for URLs without protocol
            try {
                new URL('https://' + string);
                return true;
            } catch {
                return false;
            }
        }
    }
}

// Initialize app when DOM is ready
let app;

async function initializeBearMark() {
    console.log('🔧 Initializing Chrome storage...');
    try {
        window.bearmarkDB = new ChromeStorageDB();
        await window.bearmarkDB.init();
        console.log('✅ Chrome storage ready');
        
        // Create and initialize app
        app = new BearMarkApp();
        await app.init();
        
        // Make app globally available for onclick handlers
        window.app = app;
        
    } catch (error) {
        console.error('💥 Error initializing BearMark:', error);
    }
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBearMark);
} else {
    initializeBearMark();
}
