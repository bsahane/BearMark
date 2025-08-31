// Vanilla JavaScript BearMark Application for Chrome Extension
class BearMarkApp {
    constructor() {
        this.notes = [];
        this.filteredNotes = [];
        this.selectedNote = null;
        this.searchQuery = '';
        this.searchFilters = {
            dateRange: '',
            dateFrom: '',
            dateTo: '',
            selectedTags: [],
            hasLinks: false,
            hasCheckboxes: false
        };
        this.savedSearches = [];
        this.templates = this.getDefaultTemplates();
        this.focusMode = {
            active: false,
            wordGoal: 500,
            typewriterMode: false
        };
        this.quickCapture = {
            visible: false,
            templates: this.getQuickCaptureTemplates()
        };
        this.sidebarCollapsed = false;
        this.calendarSidebarVisible = false; // Hide calendar by default
        this.isLoading = true;
        this.autoSaveTimer = null;
        this.calendarEvents = [];
        this.settingsModalVisible = false;
        this.settings = {
            calendarEnabled: false,
            autoSaveEnabled: true,
            blurEnabled: true,
            darkModeEnabled: false,
            colorScheme: 'warm',
            customAccentColor: '#dc2626',
            fontFamily: 'Inter',
            fontSize: 16,
            lineHeight: 1.6,
            contentWidth: 800
        };
        
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
                
                // Load saved settings including sidebar state
                await this.loadSettings();
                
                // Load saved searches
                await this.loadSavedSearches();
            } else {
                console.error('❌ Database not found!');
            }
            
            this.isLoading = false;
            
            // Initial render
            this.render();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply initial blur effect
            setTimeout(() => {
                this.addBlur();
            }, 100);
            
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

    async loadSettings() {
        try {
            const savedSettings = await window.bearmarkDB.getSettings();
            console.log('📋 Loaded settings:', savedSettings);
            
            // Apply saved sidebar state
            if (savedSettings.sidebarCollapsed !== undefined) {
                this.sidebarCollapsed = savedSettings.sidebarCollapsed;
                console.log('🔧 Restored sidebar state:', this.sidebarCollapsed);
            }
            
            // Apply saved settings
            if (savedSettings.calendarEnabled !== undefined) {
                this.settings.calendarEnabled = savedSettings.calendarEnabled;
                this.calendarSidebarVisible = savedSettings.calendarEnabled;
                console.log('📅 Restored calendar enabled state:', this.settings.calendarEnabled);
            }
            
            if (savedSettings.autoSaveEnabled !== undefined) {
                this.settings.autoSaveEnabled = savedSettings.autoSaveEnabled;
            }
            
            if (savedSettings.blurEnabled !== undefined) {
                this.settings.blurEnabled = savedSettings.blurEnabled;
            }
            
            if (savedSettings.darkModeEnabled !== undefined) {
                this.settings.darkModeEnabled = savedSettings.darkModeEnabled;
            }
            
            if (savedSettings.colorScheme !== undefined) {
                this.settings.colorScheme = savedSettings.colorScheme;
            }
            
            if (savedSettings.customAccentColor !== undefined) {
                this.settings.customAccentColor = savedSettings.customAccentColor;
            }
            
            if (savedSettings.fontFamily !== undefined) {
                this.settings.fontFamily = savedSettings.fontFamily;
            }
            
            if (savedSettings.fontSize !== undefined) {
                this.settings.fontSize = savedSettings.fontSize;
            }
            
            if (savedSettings.lineHeight !== undefined) {
                this.settings.lineHeight = savedSettings.lineHeight;
            }
            
            if (savedSettings.contentWidth !== undefined) {
                this.settings.contentWidth = savedSettings.contentWidth;
            }
            
            // Apply all theme settings
            this.applyAllThemeSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settingsToSave = {
                sidebarCollapsed: this.sidebarCollapsed,
                calendarEnabled: this.settings.calendarEnabled,
                autoSaveEnabled: this.settings.autoSaveEnabled,
                blurEnabled: this.settings.blurEnabled,
                darkModeEnabled: this.settings.darkModeEnabled,
                colorScheme: this.settings.colorScheme,
                customAccentColor: this.settings.customAccentColor,
                fontFamily: this.settings.fontFamily,
                fontSize: this.settings.fontSize,
                lineHeight: this.settings.lineHeight,
                contentWidth: this.settings.contentWidth
            };
            await window.bearmarkDB.updateSettings(settingsToSave);
            console.log('💾 Settings saved:', settingsToSave);
        } catch (error) {
            console.error('Error saving settings:', error);
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
        // Legacy method - now using performAdvancedSearch for better filtering
        this.performAdvancedSearch();
    }

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.applySidebarState();
        // Save the new state to Chrome storage
        this.saveSettings();
    }

    applySidebarState() {
        const sidebar = document.getElementById('sidebar');
        const title = document.getElementById('sidebar-title');
        const searchContainer = document.getElementById('search-container');
        const notesContainer = document.getElementById('notes-container');
        const newNoteBtn = document.getElementById('new-note-btn');
        
        if (this.sidebarCollapsed) {
            // Collapsed state - hide border and show only icon
            sidebar.className = sidebar.className
                .replace('w-80', 'w-16')
                .replace('border-r', '')
                .replace('border-warm-200', '');
            title.style.display = 'none';
            searchContainer.style.display = 'none';
            notesContainer.style.display = 'none';
            newNoteBtn.style.display = 'none';
        } else {
            // Expanded state - show border and all content
            sidebar.className = sidebar.className.replace('w-16', 'w-80');
            if (!sidebar.className.includes('border-r')) {
                sidebar.className += ' border-r border-warm-200';
            }
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
        this.renderCalendarSidebar();
        
        // Apply sidebar states after render
        this.applySidebarState();
        this.applyCalendarSidebarState();
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
                    <button onclick="app.createNewNote()" class="mt-2 text-red-700 hover:text-red-800 text-sm font-medium">
                        Create your first note
                    </button>
                </div>
            `;
            return;
        }
        
        const notesHtml = this.filteredNotes.map(note => {
            const isSelected = this.selectedNote && this.selectedNote.id === note.id;
            const selectedClass = isSelected ? 'bg-red-50 border-r-2 border-red-700' : '';
            const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '');
            
            return `
                <div onclick="app.selectNote(${JSON.stringify(note).replace(/"/g, '&quot;')})" 
                     class="p-4 border-b border-warm-100 cursor-pointer hover:bg-red-50 transition-colors ${selectedClass}">
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
        const focusModeBtn = document.getElementById('focus-mode-btn');
        const deleteBtn = document.getElementById('delete-btn');
        
        if (this.selectedNote) {
            noteTitle.style.display = 'block';
            noteTitle.value = this.selectedNote.title || '';
            noNoteMessage.style.display = 'none';
            exportBtn.style.display = 'block';
            if (focusModeBtn) focusModeBtn.style.display = 'block';
            deleteBtn.style.display = 'block';
        } else {
            noteTitle.style.display = 'none';
            noNoteMessage.style.display = 'block';
            exportBtn.style.display = 'none';
            if (focusModeBtn) focusModeBtn.style.display = 'none';
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
        const templatesMenu = document.getElementById('templates-menu');
        
        if (newNoteBtn && templatesMenu) {
            // Show templates menu on click
            newNoteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = templatesMenu.style.display !== 'none';
                templatesMenu.style.display = isVisible ? 'none' : 'block';
            });
            
            // Hide menu when clicking outside
            document.addEventListener('click', () => {
                templatesMenu.style.display = 'none';
            });
        } else if (newNoteBtn) {
            // Fallback to direct note creation if templates not available
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
                this.performAdvancedSearch();
            });
        }
        
        // Advanced search toggle
        const advancedSearchToggle = document.getElementById('advanced-search-toggle');
        const advancedSearchPanel = document.getElementById('advanced-search-panel');
        if (advancedSearchToggle && advancedSearchPanel) {
            advancedSearchToggle.addEventListener('click', () => {
                const isVisible = advancedSearchPanel.style.display !== 'none';
                advancedSearchPanel.style.display = isVisible ? 'none' : 'block';
                
                if (!isVisible) {
                    this.updateAvailableTags();
                    this.loadSavedSearches();
                    this.updateSearchResultsCount();
                }
            });
        }
        
        // Date filter controls
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.searchFilters.dateRange = e.target.value;
                this.toggleCustomDateRange();
                this.performAdvancedSearch();
            });
        }
        
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                this.searchFilters.dateFrom = e.target.value;
                this.performAdvancedSearch();
            });
        }
        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                this.searchFilters.dateTo = e.target.value;
                this.performAdvancedSearch();
            });
        }
        
        // Content type filters
        const filterHasLinks = document.getElementById('filter-has-links');
        const filterHasCheckboxes = document.getElementById('filter-has-checkboxes');
        
        if (filterHasLinks) {
            filterHasLinks.addEventListener('change', (e) => {
                this.searchFilters.hasLinks = e.target.checked;
                this.performAdvancedSearch();
            });
        }
        
        if (filterHasCheckboxes) {
            filterHasCheckboxes.addEventListener('change', (e) => {
                this.searchFilters.hasCheckboxes = e.target.checked;
                this.performAdvancedSearch();
            });
        }
        
        // Saved searches
        const savedSearchesDropdown = document.getElementById('saved-searches');
        if (savedSearchesDropdown) {
            savedSearchesDropdown.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadSavedSearch(e.target.value);
                }
            });
        }
        
        const saveCurrentSearchBtn = document.getElementById('save-current-search');
        if (saveCurrentSearchBtn) {
            saveCurrentSearchBtn.addEventListener('click', () => {
                this.saveCurrentSearch();
            });
        }
        
        // Clear all filters
        const clearAllFilters = document.getElementById('clear-all-filters');
        if (clearAllFilters) {
            clearAllFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // Template button event listeners
        const templateButtons = {
            'template-blank': 'blank',
            'template-meeting': 'meeting',
            'template-daily': 'daily',
            'template-todo': 'todo',
            'template-project': 'project',
            'template-ideas': 'ideas'
        };
        
        Object.entries(templateButtons).forEach(([buttonId, templateKey]) => {
            const button = document.getElementById(buttonId);
            if (button && templatesMenu) {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.createNoteFromTemplate(templateKey);
                    templatesMenu.style.display = 'none';
                });
            }
        });
        
        // Focus Mode Event Listeners
        const focusModeBtn = document.getElementById('focus-mode-btn');
        if (focusModeBtn) {
            focusModeBtn.addEventListener('click', () => {
                this.enterFocusMode();
            });
        }
        
        const exitFocusModeBtn = document.getElementById('exit-focus-mode');
        if (exitFocusModeBtn) {
            exitFocusModeBtn.addEventListener('click', () => {
                this.exitFocusMode();
            });
        }
        
        // Focus mode textarea events
        const focusTextarea = document.getElementById('focus-editor-textarea');
        const focusContent = document.getElementById('focus-editor-content');
        
        if (focusTextarea && focusContent) {
            focusTextarea.addEventListener('input', () => {
                // Update markdown rendering
                focusContent.innerHTML = this.renderMarkdown(focusTextarea.value);
                this.syncScroll('focus-editor-textarea', 'focus-editor-content');
                
                // Update stats
                this.updateFocusStats();
                
                // Auto-save to selected note
                if (this.selectedNote) {
                    this.selectedNote.content = focusTextarea.value;
                    this.saveNote();
                }
            });
            
            // Setup focus mode scrolling
            this.setupFocusModeScrolling();
        }
        
        // Focus mode goal input
        const focusGoalInput = document.getElementById('focus-word-goal');
        if (focusGoalInput) {
            focusGoalInput.addEventListener('input', () => {
                this.focusMode.wordGoal = parseInt(focusGoalInput.value) || 500;
                this.updateFocusStats();
            });
        }
        
        // Theme Control Event Listeners
        const colorSchemeSelect = document.getElementById('color-scheme');
        const customAccentColor = document.getElementById('custom-accent-color');
        const fontFamilySelect = document.getElementById('font-family');
        const fontSizeSelect = document.getElementById('font-size');
        const lineHeightSelect = document.getElementById('line-height');
        const contentWidthSlider = document.getElementById('content-width');
        const resetAccentBtn = document.getElementById('reset-accent-color');
        
        if (colorSchemeSelect) {
            colorSchemeSelect.addEventListener('change', (e) => {
                this.settings.colorScheme = e.target.value;
                this.applyColorScheme(this.settings.colorScheme);
                this.saveSettings();
            });
        }
        
        if (customAccentColor) {
            customAccentColor.addEventListener('change', (e) => {
                this.settings.customAccentColor = e.target.value;
                this.applyCustomAccentColor(this.settings.customAccentColor);
                this.saveSettings();
            });
        }
        
        if (resetAccentBtn) {
            resetAccentBtn.addEventListener('click', () => {
                this.settings.customAccentColor = '#dc2626';
                if (customAccentColor) customAccentColor.value = '#dc2626';
                this.applyCustomAccentColor(this.settings.customAccentColor);
                this.saveSettings();
            });
        }
        
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                this.settings.fontFamily = e.target.value;
                this.applyTypography(this.settings.fontFamily, this.settings.fontSize, this.settings.lineHeight);
                this.saveSettings();
            });
        }
        
        if (fontSizeSelect) {
            fontSizeSelect.addEventListener('change', (e) => {
                this.settings.fontSize = parseInt(e.target.value);
                this.applyTypography(this.settings.fontFamily, this.settings.fontSize, this.settings.lineHeight);
                this.saveSettings();
            });
        }
        
        if (lineHeightSelect) {
            lineHeightSelect.addEventListener('change', (e) => {
                this.settings.lineHeight = parseFloat(e.target.value);
                this.applyTypography(this.settings.fontFamily, this.settings.fontSize, this.settings.lineHeight);
                this.saveSettings();
            });
        }
        
        if (contentWidthSlider) {
            const contentWidthValue = document.getElementById('content-width-value');
            contentWidthSlider.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                if (contentWidthValue) contentWidthValue.textContent = `${width}px`;
                this.settings.contentWidth = width;
                this.applyContentWidth(width);
                this.saveSettings();
            });
        }
        
        // Quick Capture Event Listeners
        const quickCaptureModal = document.getElementById('quick-capture-modal');
        const quickCaptureTemplate = document.getElementById('quick-capture-template');
        const quickCaptureContent = document.getElementById('quick-capture-content');
        const quickCaptureSave = document.getElementById('quick-capture-save');
        const quickCaptureSaveContinue = document.getElementById('quick-capture-save-continue');
        const closeQuickCapture = document.getElementById('close-quick-capture');
        const quickCaptureCloseAfter = document.getElementById('quick-capture-close-after');
        
        if (quickCaptureTemplate) {
            quickCaptureTemplate.addEventListener('change', (e) => {
                this.applyQuickCaptureTemplate(e.target.value);
            });
        }
        
        if (quickCaptureContent) {
            quickCaptureContent.addEventListener('input', () => {
                this.updateQuickCaptureCount();
            });
        }
        
        if (quickCaptureSave) {
            quickCaptureSave.addEventListener('click', () => {
                const closeAfter = quickCaptureCloseAfter?.checked !== false;
                this.saveQuickCapture(closeAfter);
            });
        }
        
        if (quickCaptureSaveContinue) {
            quickCaptureSaveContinue.addEventListener('click', () => {
                this.saveAndContinueQuickCapture();
            });
        }
        
        if (closeQuickCapture) {
            closeQuickCapture.addEventListener('click', () => {
                this.hideQuickCapture();
            });
        }
        
        // Close quick capture when clicking outside
        if (quickCaptureModal) {
            quickCaptureModal.addEventListener('click', (e) => {
                if (e.target === quickCaptureModal) {
                    this.hideQuickCapture();
                }
            });
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+N to open Quick Capture
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.showQuickCapture();
            }
            
            // F11 to toggle focus mode
            if (e.key === 'F11' && this.selectedNote) {
                e.preventDefault();
                if (this.focusMode.active) {
                    this.exitFocusMode();
                } else {
                    this.enterFocusMode();
                }
            }
            
            // Escape to exit focus mode or close quick capture
            if (e.key === 'Escape') {
                if (this.focusMode.active) {
                    this.exitFocusMode();
                } else if (this.quickCapture.visible) {
                    this.hideQuickCapture();
                }
            }
            
            // Ctrl+Enter to save in quick capture
            if (e.ctrlKey && e.key === 'Enter' && this.quickCapture.visible) {
                e.preventDefault();
                const closeAfter = quickCaptureCloseAfter?.checked !== false;
                this.saveQuickCapture(closeAfter);
            }
        });
        
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
            
            // Handle blur effect - remove blur on focus/click
            editorTextarea.addEventListener('focus', () => {
                this.removeBlur();
            });
            
            editorTextarea.addEventListener('click', () => {
                this.removeBlur();
            });
        }
        
        // Add blur effect on editor container hover
        const editorContainer = document.getElementById('unified-editor');
        if (editorContainer) {
            editorContainer.addEventListener('mouseenter', () => {
                this.removeBlur();
            });
            
            editorContainer.addEventListener('mouseleave', () => {
                // Only add blur back if textarea is not focused
                if (editorTextarea && document.activeElement !== editorTextarea) {
                    this.addBlur();
                }
            });
        }
        
        // Handle blur when clicking outside editor
        document.addEventListener('click', (e) => {
            const unifiedEditor = document.getElementById('unified-editor');
            if (unifiedEditor && !unifiedEditor.contains(e.target)) {
                this.addBlur();
            }
        });
        
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
        
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        // Settings modal close
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => this.hideSettings());
        }
        
        // Settings save button
        const settingsSave = document.getElementById('settings-save');
        if (settingsSave) {
            settingsSave.addEventListener('click', () => this.saveSettingsFromModal());
        }
        
        // Settings reset button
        const settingsReset = document.getElementById('settings-reset');
        if (settingsReset) {
            settingsReset.addEventListener('click', () => this.resetSettingsToDefaults());
        }
        
        // Export/Import Event Listeners
        
        // Export menu toggle
        const exportBtn = document.getElementById('export-btn');
        const exportMenu = document.getElementById('export-menu');
        if (exportBtn && exportMenu) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close export menu when clicking outside
            document.addEventListener('click', () => {
                exportMenu.style.display = 'none';
            });
        }
        
        // Individual export buttons
        const exportMarkdown = document.getElementById('export-markdown');
        const exportHtml = document.getElementById('export-html');
        const exportJson = document.getElementById('export-json');
        
        if (exportMarkdown) {
            exportMarkdown.addEventListener('click', () => {
                this.exportCurrentNote('markdown');
                exportMenu.style.display = 'none';
            });
        }
        
        if (exportHtml) {
            exportHtml.addEventListener('click', () => {
                this.exportCurrentNote('html');
                exportMenu.style.display = 'none';
            });
        }
        
        if (exportJson) {
            exportJson.addEventListener('click', () => {
                this.exportCurrentNote('json');
                exportMenu.style.display = 'none';
            });
        }
        
        // Export all notes buttons (in settings)
        const exportAllJson = document.getElementById('export-all-json');
        const exportAllMarkdown = document.getElementById('export-all-markdown');
        
        if (exportAllJson) {
            exportAllJson.addEventListener('click', () => {
                this.exportAllNotes('json');
            });
        }
        
        if (exportAllMarkdown) {
            exportAllMarkdown.addEventListener('click', () => {
                this.exportAllNotes('markdown');
            });
        }
        
        // Import functionality
        const importBtn = document.getElementById('import-notes-btn');
        const importFileInput = document.getElementById('import-file-input');
        
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', () => {
                importFileInput.click();
            });
            
            importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importNotes(file);
                    importFileInput.value = ''; // Reset input
                }
            });
        }
        
        // Calendar enabled checkbox change
        const calendarCheckbox = document.getElementById('calendar-enabled');
        if (calendarCheckbox) {
            calendarCheckbox.addEventListener('change', (e) => {
                const connectSection = document.getElementById('calendar-connect-section');
                if (connectSection) {
                    connectSection.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        // Calendar connect button in settings
        const calendarConnectBtn = document.getElementById('calendar-connect-btn');
        if (calendarConnectBtn) {
            calendarConnectBtn.addEventListener('click', () => this.authenticateCalendar());
        }
        
        // Calendar sidebar toggle (close button)
        const calendarSidebarToggle = document.getElementById('calendar-sidebar-toggle');
        if (calendarSidebarToggle) {
            calendarSidebarToggle.addEventListener('click', () => {
                // Instead of toggling, just close the calendar and update settings
                this.settings.calendarEnabled = false;
                this.calendarSidebarVisible = false;
                this.applyCalendarSidebarState();
                this.saveSettings();
            });
        }
        
        // Close settings modal when clicking outside
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.hideSettings();
                }
            });
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

    toggleCalendarSidebar() {
        console.log('🔄 Toggling calendar sidebar. Current state:', this.calendarSidebarVisible);
        this.calendarSidebarVisible = !this.calendarSidebarVisible;
        console.log('📅 New calendar sidebar state:', this.calendarSidebarVisible);
        
        this.applyCalendarSidebarState();
        this.saveSettings();
        
        // Load calendar events if becoming visible
        if (this.calendarSidebarVisible) {
            console.log('👀 Calendar becoming visible, loading events...');
            this.loadCalendarEvents();
        }
    }

    applyCalendarSidebarState() {
        const calendarSidebar = document.getElementById('calendar-sidebar');
        console.log('🎛️ Applying calendar sidebar state. Visible:', this.calendarSidebarVisible);
        console.log('📱 Calendar sidebar element found:', !!calendarSidebar);
        
        if (calendarSidebar) {
            const displayValue = this.calendarSidebarVisible ? 'flex' : 'none';
            calendarSidebar.style.display = displayValue;
            console.log('✅ Calendar sidebar display set to:', displayValue);
        } else {
            console.error('❌ Calendar sidebar element not found!');
        }
    }

    async loadCalendarEvents() {
        if (!window.googleCalendar) return;
        
        try {
            // Check if authenticated
            const isAuth = await window.googleCalendar.checkAuth();
            this.renderCalendarAuth(isAuth);
            
            if (isAuth) {
                const events = await window.googleCalendar.getTodaysEvents();
                this.calendarEvents = events;
                this.renderCalendarEvents();
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    }

    async authenticateCalendar() {
        if (!window.googleCalendar) return;
        
        try {
            const success = await window.googleCalendar.authenticate();
            this.renderCalendarAuth(success);
            
            if (success) {
                await this.loadCalendarEvents();
            }
        } catch (error) {
            console.error('Error authenticating calendar:', error);
            this.renderCalendarAuth(false);
        }
    }

    renderCalendarSidebar() {
        // This method will be called during render to ensure calendar sidebar is properly displayed
        this.loadCalendarEvents();
    }

    renderCalendarAuth(isAuthenticated) {
        const authStatus = document.getElementById('auth-status');
        if (!authStatus) return;
        
        if (isAuthenticated) {
            authStatus.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm text-green-600 font-medium">✅ Connected</span>
                    <button 
                        class="text-xs text-red-700 hover:text-red-800 underline disconnect-btn"
                    >
                        Disconnect
                    </button>
                </div>
            `;
            
            // Add event listener to disconnect button
            setTimeout(() => {
                const disconnectBtn = authStatus.querySelector('.disconnect-btn');
                if (disconnectBtn) {
                    disconnectBtn.addEventListener('click', () => this.disconnectCalendar());
                }
            }, 0);
        } else {
            authStatus.innerHTML = `
                <button 
                    class="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium auth-btn"
                >
                    📅 Enable Calendar View
                </button>
                <p class="text-xs text-warm-500 mt-2 text-center">Click to show today's events</p>
            `;
            
            // Add event listener to auth button
            setTimeout(() => {
                const authBtn = authStatus.querySelector('.auth-btn');
                if (authBtn) {
                    authBtn.addEventListener('click', () => this.authenticateCalendar());
                }
            }, 0);
        }
    }

    renderCalendarEvents() {
        const container = document.getElementById('calendar-events');
        if (!container) return;
        
        if (!window.googleCalendar?.isAuthenticated) {
            container.innerHTML = `
                <div class="text-center text-warm-500 mt-8">
                    Connect your Google Calendar to see today's events
                </div>
            `;
            return;
        }
        
        if (this.calendarEvents.length === 0) {
            container.innerHTML = `
                <div class="text-center text-warm-500 mt-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p class="text-warm-500">No events today</p>
                    <p class="text-xs text-warm-400 mt-2">Enjoy your free day!</p>
                </div>
            `;
            return;
        }
        
        const eventsHtml = this.calendarEvents.map(event => {
            const isNow = window.googleCalendar.isEventNow(event);
            const nowClass = isNow ? 'bg-red-50 border-l-4 border-red-700' : '';
            const timeString = window.googleCalendar.formatEventTime(event);
            
            return `
                <div class="p-3 border-b border-warm-100 ${nowClass}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-medium text-warm-900 text-sm mb-1">${event.summary || 'Untitled Event'}</h4>
                            <p class="text-xs text-red-700 font-medium">${timeString}</p>
                            ${event.location ? `<p class="text-xs text-warm-500 mt-1">📍 ${event.location}</p>` : ''}
                        </div>
                        ${isNow ? '<div class="w-2 h-2 bg-red-700 rounded-full mt-1 ml-2"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = eventsHtml;
    }

    async disconnectCalendar() {
        if (window.googleCalendar) {
            await window.googleCalendar.clearAuth();
            this.calendarEvents = [];
            this.renderCalendarAuth(false);
            this.renderCalendarEvents();
            console.log('📅 Calendar disconnected by user');
        }
    }

    // Settings Modal Methods
    showSettings() {
        this.settingsModalVisible = true;
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.populateSettingsForm();
        }
    }

    hideSettings() {
        this.settingsModalVisible = false;
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    populateSettingsForm() {
        // Set calendar enabled checkbox
        const calendarCheckbox = document.getElementById('calendar-enabled');
        if (calendarCheckbox) {
            calendarCheckbox.checked = this.settings.calendarEnabled;
        }
        
        // Set auto-save checkbox
        const autoSaveCheckbox = document.getElementById('auto-save-enabled');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.checked = this.settings.autoSaveEnabled;
        }
        
        // Set blur checkbox
        const blurCheckbox = document.getElementById('blur-enabled');
        if (blurCheckbox) {
            blurCheckbox.checked = this.settings.blurEnabled;
        }
        
        // Set dark mode checkbox
        const darkModeCheckbox = document.getElementById('dark-mode-enabled');
        if (darkModeCheckbox) {
            darkModeCheckbox.checked = this.settings.darkModeEnabled;
        }
        
        // Set theme settings
        const colorSchemeSelect = document.getElementById('color-scheme');
        const customAccentColor = document.getElementById('custom-accent-color');
        const fontFamilySelect = document.getElementById('font-family');
        const fontSizeSelect = document.getElementById('font-size');
        const lineHeightSelect = document.getElementById('line-height');
        const contentWidthSlider = document.getElementById('content-width');
        const contentWidthValue = document.getElementById('content-width-value');
        
        if (colorSchemeSelect) colorSchemeSelect.value = this.settings.colorScheme;
        if (customAccentColor) customAccentColor.value = this.settings.customAccentColor;
        if (fontFamilySelect) fontFamilySelect.value = this.settings.fontFamily;
        if (fontSizeSelect) fontSizeSelect.value = this.settings.fontSize;
        if (lineHeightSelect) lineHeightSelect.value = this.settings.lineHeight;
        if (contentWidthSlider) {
            contentWidthSlider.value = this.settings.contentWidth;
            if (contentWidthValue) contentWidthValue.textContent = `${this.settings.contentWidth}px`;
        }
        
        // Show/hide calendar connect section
        const connectSection = document.getElementById('calendar-connect-section');
        if (connectSection) {
            connectSection.style.display = this.settings.calendarEnabled ? 'block' : 'none';
        }
        
        // Update calendar auth status
        this.updateCalendarAuthStatus();
    }

    updateCalendarAuthStatus() {
        const statusElement = document.getElementById('calendar-auth-status');
        if (statusElement && window.googleCalendar) {
            const isConnected = window.googleCalendar.isAuthenticated;
            statusElement.innerHTML = isConnected 
                ? '<span class="text-green-600">📅 Calendar: Connected</span>'
                : '<span class="text-warm-600">📅 Calendar: Not connected</span>';
        }
    }

    async saveSettingsFromModal() {
        // Get values from form
        const calendarCheckbox = document.getElementById('calendar-enabled');
        const autoSaveCheckbox = document.getElementById('auto-save-enabled');
        const blurCheckbox = document.getElementById('blur-enabled');
        const darkModeCheckbox = document.getElementById('dark-mode-enabled');
        
        // Update settings
        this.settings.calendarEnabled = calendarCheckbox?.checked || false;
        this.settings.autoSaveEnabled = autoSaveCheckbox?.checked || true;
        this.settings.blurEnabled = blurCheckbox?.checked || true;
        this.settings.darkModeEnabled = darkModeCheckbox?.checked || false;
        
        // Theme settings
        const colorSchemeSelect = document.getElementById('color-scheme');
        const customAccentColor = document.getElementById('custom-accent-color');
        const fontFamilySelect = document.getElementById('font-family');
        const fontSizeSelect = document.getElementById('font-size');
        const lineHeightSelect = document.getElementById('line-height');
        const contentWidthSlider = document.getElementById('content-width');
        
        if (colorSchemeSelect) this.settings.colorScheme = colorSchemeSelect.value;
        if (customAccentColor) this.settings.customAccentColor = customAccentColor.value;
        if (fontFamilySelect) this.settings.fontFamily = fontFamilySelect.value;
        if (fontSizeSelect) this.settings.fontSize = parseInt(fontSizeSelect.value);
        if (lineHeightSelect) this.settings.lineHeight = parseFloat(lineHeightSelect.value);
        if (contentWidthSlider) this.settings.contentWidth = parseInt(contentWidthSlider.value);
        
        // Apply calendar setting
        this.calendarSidebarVisible = this.settings.calendarEnabled;
        this.applyCalendarSidebarState();
        
        // Apply blur setting
        if (!this.settings.blurEnabled) {
            this.removeBlur();
        }
        
        // Apply all theme settings
        this.applyAllThemeSettings();
        
        // Save to storage
        await this.saveSettings();
        
        // Hide modal
        this.hideSettings();
        
        console.log('⚙️ Settings saved and applied:', this.settings);
    }

    resetSettingsToDefaults() {
        this.settings = {
            calendarEnabled: false,
            autoSaveEnabled: true,
            blurEnabled: true,
            darkModeEnabled: false,
            colorScheme: 'warm',
            customAccentColor: '#dc2626',
            fontFamily: 'Inter',
            fontSize: 16,
            lineHeight: 1.6,
            contentWidth: 800
        };
        
        this.populateSettingsForm();
        console.log('🔄 Settings reset to defaults');
    }

    addBlur() {
        // Only add blur if enabled in settings
        if (!this.settings.blurEnabled) return;
        
        const content = document.getElementById('editor-content');
        const textarea = document.getElementById('editor-textarea');
        if (content) {
            content.classList.add('blurred-content');
        }
        if (textarea) {
            textarea.classList.add('blurred-input');
        }
    }

    removeBlur() {
        const content = document.getElementById('editor-content');
        const textarea = document.getElementById('editor-textarea');
        if (content) {
            content.classList.remove('blurred-content');
        }
        if (textarea) {
            textarea.classList.remove('blurred-input');
        }
    }
    
    // Theme Management System
    applyTheme(isDark) {
        const html = document.documentElement;
        if (isDark) {
            html.setAttribute('data-theme', 'dark');
        } else {
            html.removeAttribute('data-theme');
        }
        console.log('🌙 Theme applied:', isDark ? 'dark' : 'light');
    }
    
    applyColorScheme(scheme) {
        const html = document.documentElement;
        html.setAttribute('data-color-scheme', scheme);
        console.log('🎨 Color scheme applied:', scheme);
    }
    
    applyCustomAccentColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--custom-accent', color);
        console.log('🎯 Custom accent color applied:', color);
    }
    
    applyTypography(fontFamily, fontSize, lineHeight) {
        const root = document.documentElement;
        root.style.setProperty('--font-family', fontFamily);
        root.style.setProperty('--font-size', `${fontSize}px`);
        root.style.setProperty('--line-height', lineHeight);
        console.log('📝 Typography applied:', { fontFamily, fontSize, lineHeight });
    }
    
    applyContentWidth(width) {
        const root = document.documentElement;
        root.style.setProperty('--content-width', `${width}px`);
        console.log('📏 Content width applied:', `${width}px`);
    }
    
    applyAllThemeSettings() {
        this.applyTheme(this.settings.darkModeEnabled);
        this.applyColorScheme(this.settings.colorScheme);
        this.applyCustomAccentColor(this.settings.customAccentColor);
        this.applyTypography(
            this.settings.fontFamily,
            this.settings.fontSize,
            this.settings.lineHeight
        );
        this.applyContentWidth(this.settings.contentWidth);
        console.log('🎨 All theme settings applied');
    }
    
    // Export/Import System
    async exportCurrentNote(format = 'markdown') {
        if (!this.selectedNote) return;
        
        const note = this.selectedNote;
        const timestamp = new Date().toISOString().split('T')[0];
        let content = '';
        let filename = '';
        let mimeType = '';
        
        switch (format) {
            case 'markdown':
                content = `# ${note.title}\n\n${note.content}`;
                filename = `${note.title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.md`;
                mimeType = 'text/markdown';
                break;
                
            case 'html':
                const htmlContent = marked.parse(note.content);
                content = `<!DOCTYPE html>
<html>
<head>
    <title>${note.title}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Inter, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #78716c; }
        h1, h2, h3, h4, h5, h6 { color: #dc2626; }
        code { background: #fef7f0; padding: 2px 4px; border-radius: 4px; }
        pre { background: #fef7f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        blockquote { border-left: 4px solid #dc2626; padding-left: 1rem; margin: 1rem 0; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    ${htmlContent}
    <hr>
    <small>Exported from BearMark on ${new Date().toLocaleDateString()}</small>
</body>
</html>`;
                filename = `${note.title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.html`;
                mimeType = 'text/html';
                break;
                
            case 'json':
                content = JSON.stringify(note, null, 2);
                filename = `${note.title.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.json`;
                mimeType = 'application/json';
                break;
        }
        
        this.downloadFile(content, filename, mimeType);
        console.log(`📥 Exported note "${note.title}" as ${format.toUpperCase()}`);
    }
    
    async exportAllNotes(format = 'json') {
        const notes = await window.bearmarkDB.getAllNotes();
        const timestamp = new Date().toISOString().split('T')[0];
        let content = '';
        let filename = '';
        let mimeType = '';
        
        switch (format) {
            case 'json':
                const exportData = {
                    notes: notes,
                    settings: this.settings,
                    exportDate: new Date().toISOString(),
                    version: '1.0.0',
                    app: 'BearMark'
                };
                content = JSON.stringify(exportData, null, 2);
                filename = `BearMark_Backup_${timestamp}.json`;
                mimeType = 'application/json';
                break;
                
            case 'markdown':
                content = notes.map(note => {
                    return `# ${note.title}\n\n${note.content}\n\n---\n\n`;
                }).join('');
                content = `# BearMark Notes Archive\n\nExported on: ${new Date().toLocaleDateString()}\nTotal Notes: ${notes.length}\n\n---\n\n${content}`;
                filename = `BearMark_Notes_${timestamp}.md`;
                mimeType = 'text/markdown';
                break;
        }
        
        this.downloadFile(content, filename, mimeType);
        console.log(`📥 Exported ${notes.length} notes as ${format.toUpperCase()}`);
    }
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    async importNotes(file) {
        try {
            const content = await this.readFile(file);
            let imported = 0;
            
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(content);
                
                // Handle BearMark backup format
                if (data.app === 'BearMark' && data.notes) {
                    for (const note of data.notes) {
                        // Create note with new ID to avoid conflicts
                        await window.bearmarkDB.createNote({
                            title: note.title + ' (Imported)',
                            content: note.content,
                            tags: note.tags || []
                        });
                        imported++;
                    }
                } else if (Array.isArray(data)) {
                    // Handle array of notes
                    for (const note of data) {
                        await window.bearmarkDB.createNote({
                            title: note.title || 'Imported Note',
                            content: note.content || '',
                            tags: note.tags || []
                        });
                        imported++;
                    }
                } else if (data.title && data.content) {
                    // Handle single note
                    await window.bearmarkDB.createNote({
                        title: data.title + ' (Imported)',
                        content: data.content,
                        tags: data.tags || []
                    });
                    imported++;
                }
            } else if (file.name.match(/\.(md|markdown|txt)$/)) {
                // Handle markdown files
                const title = file.name.replace(/\.(md|markdown|txt)$/, '');
                await window.bearmarkDB.createNote({
                    title: `${title} (Imported)`,
                    content: content,
                    tags: []
                });
                imported++;
            }
            
            if (imported > 0) {
                await this.loadNotes();
                this.render();
                console.log(`📤 Successfully imported ${imported} notes`);
                alert(`Successfully imported ${imported} notes!`);
            } else {
                alert('No notes found in the selected file.');
            }
        } catch (error) {
            console.error('Error importing notes:', error);
            alert('Error importing notes. Please check the file format.');
        }
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    // Advanced Search System
    async performAdvancedSearch() {
        const searchTerm = this.searchQuery.toLowerCase();
        let results = [...this.notes];
        
        // Filter by search term
        if (searchTerm) {
            results = results.filter(note => 
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        // Filter by date range
        if (this.searchFilters.dateRange) {
            results = this.filterByDateRange(results, this.searchFilters.dateRange);
        } else if (this.searchFilters.dateFrom || this.searchFilters.dateTo) {
            results = this.filterByCustomDateRange(results, this.searchFilters.dateFrom, this.searchFilters.dateTo);
        }
        
        // Filter by tags
        if (this.searchFilters.selectedTags.length > 0) {
            results = results.filter(note => 
                note.tags && this.searchFilters.selectedTags.some(tag => 
                    note.tags.includes(tag)
                )
            );
        }
        
        // Filter by content type
        if (this.searchFilters.hasLinks) {
            results = results.filter(note => 
                /\[.*?\]\(.*?\)/.test(note.content) || /https?:\/\//.test(note.content)
            );
        }
        
        if (this.searchFilters.hasCheckboxes) {
            results = results.filter(note => 
                /\[\s*[x ]?\s*\]/.test(note.content)
            );
        }
        
        this.filteredNotes = results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        this.updateSearchResultsCount();
        this.renderNotesList();
    }
    
    filterByDateRange(notes, range) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        let fromDate, toDate;
        
        switch (range) {
            case 'today':
                fromDate = today;
                toDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                fromDate = weekStart;
                toDate = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                toDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                fromDate = new Date(now.getFullYear(), 0, 1);
                toDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            default:
                return notes;
        }
        
        return notes.filter(note => {
            const noteDate = new Date(note.updated_at);
            return noteDate >= fromDate && noteDate < toDate;
        });
    }
    
    filterByCustomDateRange(notes, fromStr, toStr) {
        if (!fromStr && !toStr) return notes;
        
        const fromDate = fromStr ? new Date(fromStr + 'T00:00:00') : null;
        const toDate = toStr ? new Date(toStr + 'T23:59:59') : null;
        
        return notes.filter(note => {
            const noteDate = new Date(note.updated_at);
            
            if (fromDate && noteDate < fromDate) return false;
            if (toDate && noteDate > toDate) return false;
            
            return true;
        });
    }
    
    getAllTags() {
        const tagSet = new Set();
        this.notes.forEach(note => {
            if (note.tags) {
                note.tags.forEach(tag => tagSet.add(tag));
            }
            
            // Extract hashtags from content
            const hashtagMatches = note.content.match(/#\w+/g);
            if (hashtagMatches) {
                hashtagMatches.forEach(hashtag => tagSet.add(hashtag.slice(1)));
            }
        });
        
        return Array.from(tagSet).sort();
    }
    
    updateAvailableTags() {
        const tagsContainer = document.getElementById('available-tags');
        if (!tagsContainer) return;
        
        const tags = this.getAllTags();
        tagsContainer.innerHTML = '';
        
        if (tags.length === 0) {
            tagsContainer.innerHTML = '<span class="text-xs text-warm-400">No tags found</span>';
            return;
        }
        
        tags.forEach(tag => {
            const isSelected = this.searchFilters.selectedTags.includes(tag);
            const tagButton = document.createElement('button');
            tagButton.className = `px-2 py-1 text-xs rounded-full border transition-colors ${
                isSelected 
                    ? 'bg-red-700 text-white border-red-700' 
                    : 'bg-white text-warm-600 border-warm-300 hover:border-red-700 hover:text-red-700'
            }`;
            tagButton.textContent = '#' + tag;
            tagButton.addEventListener('click', () => this.toggleTagFilter(tag));
            tagsContainer.appendChild(tagButton);
        });
    }
    
    toggleTagFilter(tag) {
        const index = this.searchFilters.selectedTags.indexOf(tag);
        if (index > -1) {
            this.searchFilters.selectedTags.splice(index, 1);
        } else {
            this.searchFilters.selectedTags.push(tag);
        }
        this.updateAvailableTags();
        this.performAdvancedSearch();
    }
    
    updateSearchResultsCount() {
        const countElement = document.getElementById('search-results-count');
        if (countElement) {
            const count = this.filteredNotes.length;
            const total = this.notes.length;
            countElement.textContent = `${count} of ${total} notes`;
        }
    }
    
    async saveCurrentSearch() {
        const searchName = prompt('Enter a name for this search:');
        if (!searchName) return;
        
        const searchData = {
            name: searchName,
            query: this.searchQuery,
            filters: { ...this.searchFilters },
            created: new Date().toISOString()
        };
        
        this.savedSearches.push(searchData);
        await this.saveSavedSearches();
        this.updateSavedSearchesDropdown();
        
        console.log('💾 Saved search:', searchName);
    }
    
    async loadSavedSearch(searchName) {
        const search = this.savedSearches.find(s => s.name === searchName);
        if (!search) return;
        
        // Apply search query
        this.searchQuery = search.query;
        document.getElementById('search-input').value = this.searchQuery;
        
        // Apply filters
        this.searchFilters = { ...search.filters };
        this.updateSearchFiltersUI();
        
        // Perform search
        await this.performAdvancedSearch();
    }
    
    async saveSavedSearches() {
        try {
            await window.bearmarkDB.updateSettings({ savedSearches: this.savedSearches });
        } catch (error) {
            console.error('Error saving searches:', error);
        }
    }
    
    async loadSavedSearches() {
        try {
            const settings = await window.bearmarkDB.getSettings();
            this.savedSearches = settings.savedSearches || [];
            this.updateSavedSearchesDropdown();
        } catch (error) {
            console.error('Error loading saved searches:', error);
        }
    }
    
    updateSavedSearchesDropdown() {
        const dropdown = document.getElementById('saved-searches');
        if (!dropdown) return;
        
        dropdown.innerHTML = '<option value="">Select saved search...</option>';
        
        this.savedSearches.forEach(search => {
            const option = document.createElement('option');
            option.value = search.name;
            option.textContent = search.name;
            dropdown.appendChild(option);
        });
    }
    
    updateSearchFiltersUI() {
        // Update date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) dateFilter.value = this.searchFilters.dateRange;
        
        // Update custom date range
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        if (dateFrom) dateFrom.value = this.searchFilters.dateFrom;
        if (dateTo) dateTo.value = this.searchFilters.dateTo;
        
        // Update content type filters
        const hasLinks = document.getElementById('filter-has-links');
        const hasCheckboxes = document.getElementById('filter-has-checkboxes');
        if (hasLinks) hasLinks.checked = this.searchFilters.hasLinks;
        if (hasCheckboxes) hasCheckboxes.checked = this.searchFilters.hasCheckboxes;
        
        // Update tags and other UI elements
        this.updateAvailableTags();
        this.toggleCustomDateRange();
    }
    
    clearAllFilters() {
        this.searchQuery = '';
        this.searchFilters = {
            dateRange: '',
            dateFrom: '',
            dateTo: '',
            selectedTags: [],
            hasLinks: false,
            hasCheckboxes: false
        };
        
        document.getElementById('search-input').value = '';
        this.updateSearchFiltersUI();
        this.performAdvancedSearch();
    }
    
    toggleCustomDateRange() {
        const customRange = document.getElementById('custom-date-range');
        const dateFilter = document.getElementById('date-filter');
        if (customRange && dateFilter) {
            customRange.style.display = dateFilter.value === 'custom' ? 'flex' : 'none';
        }
    }
    
    // Note Templates System
    getDefaultTemplates() {
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        const time = today.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit'
        });
        
        return {
            blank: {
                title: 'Untitled Note',
                content: `**${dateString}**\n\n`
            },
            meeting: {
                title: 'Meeting Notes',
                content: `**Meeting Notes - ${dateString}**\n\n## Meeting Details\n- **Date:** ${dateString}\n- **Time:** ${time}\n- **Attendees:** \n- **Location/Link:** \n\n## Agenda\n- [ ] \n- [ ] \n- [ ] \n\n## Discussion Points\n\n### Topic 1\n- \n\n### Topic 2\n- \n\n## Action Items\n- [ ] **@Person:** Action item description\n- [ ] **@Person:** Action item description\n- [ ] **@Person:** Action item description\n\n## Next Steps\n- \n\n## Notes\n\n\n---\n*Meeting ended at:*`
            },
            daily: {
                title: `Daily Journal - ${today.toLocaleDateString()}`,
                content: `**${dateString}**\n\n## Today's Focus\n*What are my main priorities today?*\n- \n- \n- \n\n## Mood & Energy\n*How am I feeling today?*\n\n\n## Accomplishments\n*What did I achieve today?*\n- \n- \n\n## Challenges\n*What obstacles did I face?*\n- \n\n## Lessons Learned\n*What insights did I gain?*\n\n\n## Tomorrow's Priorities\n*What should I focus on tomorrow?*\n- [ ] \n- [ ] \n- [ ] \n\n## Gratitude\n*What am I grateful for today?*\n- \n- \n- \n\n## Reflection\n*Additional thoughts about today...*\n\n\n#journal #daily #reflection`
            },
            todo: {
                title: 'Todo List',
                content: `**Todo List - ${dateString}**\n\n## High Priority 🔴\n- [ ] \n- [ ] \n- [ ] \n\n## Medium Priority 🟡\n- [ ] \n- [ ] \n- [ ] \n\n## Low Priority 🟢\n- [ ] \n- [ ] \n- [ ] \n\n## Completed Today ✅\n- [x] \n\n## Backlog 📋\n- [ ] \n- [ ] \n\n## Ideas & Maybe Later 💡\n- [ ] \n- [ ] \n\n---\n\n### Quick Capture\n*Jot down quick tasks here:*\n- [ ] \n\n#todo #tasks #productivity`
            },
            project: {
                title: 'Project Planning',
                content: `**Project Planning - ${dateString}**\n\n# Project Name\n\n## Overview\n*Brief description of the project*\n\n\n## Objectives\n*What are we trying to achieve?*\n- \n- \n- \n\n## Success Criteria\n*How will we know we've succeeded?*\n- \n- \n\n## Timeline\n- **Start Date:** \n- **Target Completion:** \n- **Key Milestones:** \n\n## Resources Needed\n### Team\n- \n- \n\n### Tools & Technology\n- \n- \n\n### Budget\n- \n\n## Project Phases\n\n### Phase 1: Planning\n- [ ] Define requirements\n- [ ] Create project plan\n- [ ] Assign resources\n\n### Phase 2: Development\n- [ ] \n- [ ] \n- [ ] \n\n### Phase 3: Testing\n- [ ] \n- [ ] \n- [ ] \n\n### Phase 4: Launch\n- [ ] \n- [ ] \n- [ ] \n\n## Risks & Mitigation\n- **Risk:** | **Impact:** | **Mitigation:** \n- **Risk:** | **Impact:** | **Mitigation:** \n\n## Notes\n\n\n#project #planning #management`
            },
            ideas: {
                title: 'Ideas & Brainstorm',
                content: `**Ideas & Brainstorm - ${dateString}**\n\n## 💡 Main Topic\n*What are we brainstorming about?*\n\n\n## 🎯 Goals\n*What do we want to achieve?*\n- \n- \n\n## 🌟 Ideas\n\n### Idea 1: \n**Description:** \n**Pros:** \n**Cons:** \n**Effort:** Low/Medium/High\n\n### Idea 2: \n**Description:** \n**Pros:** \n**Cons:** \n**Effort:** Low/Medium/High\n\n### Idea 3: \n**Description:** \n**Pros:** \n**Cons:** \n**Effort:** Low/Medium/High\n\n## 🔥 Top Picks\n*Which ideas stand out?*\n1. \n2. \n3. \n\n## 🚀 Next Actions\n- [ ] Research idea #1\n- [ ] Validate concept with users\n- [ ] Create prototype\n- [ ] Get feedback\n\n## 📚 Resources & References\n- \n- \n\n## 💭 Random Thoughts\n*Capture any additional thoughts here...*\n\n\n#ideas #brainstorm #creativity #innovation`
            }
        };
    }
    
    async createNoteFromTemplate(templateKey) {
        try {
            const template = this.templates[templateKey];
            if (!template) {
                console.error('Template not found:', templateKey);
                return;
            }
            
            const note = await window.bearmarkDB.createNote({
                title: template.title,
                content: template.content,
                tags: this.extractTagsFromContent(template.content)
            });
            
            // Add to notes array and refresh list
            this.notes.unshift(note);
            this.filteredNotes = [...this.notes];
            
            // Select the new note
            this.selectNote(note);
            this.render();
            
            // Focus on the editor
            setTimeout(() => {
                const textarea = document.getElementById('editor-textarea');
                if (textarea) {
                    textarea.focus();
                    // Position cursor at the end of the content
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                }
            }, 100);
            
            console.log(`📝 Created note from template: ${templateKey}`);
        } catch (error) {
            console.error('Error creating note from template:', error);
        }
    }
    
    extractTagsFromContent(content) {
        const tagMatches = content.match(/#\w+/g);
        return tagMatches ? tagMatches.map(tag => tag.slice(1)) : [];
    }
    
    // Focus Mode System
    enterFocusMode() {
        if (!this.selectedNote) return;
        
        this.focusMode.active = true;
        const overlay = document.getElementById('focus-mode-overlay');
        const focusTextarea = document.getElementById('focus-editor-textarea');
        const focusContent = document.getElementById('focus-editor-content');
        const focusBtn = document.getElementById('focus-mode-btn');
        
        if (overlay && focusTextarea && focusContent) {
            // Show focus mode overlay
            overlay.classList.remove('focus-mode-hidden');
            overlay.classList.add('focus-mode-active');
            
            // Copy current note content
            focusTextarea.value = this.selectedNote.content;
            focusContent.innerHTML = this.renderMarkdown(this.selectedNote.content);
            
            // Focus on the editor
            focusTextarea.focus();
            
            // Update stats
            this.updateFocusStats();
            
            // Hide focus mode button (it's in focus mode now)
            if (focusBtn) focusBtn.style.display = 'none';
            
            console.log('🎯 Entered focus mode');
        }
    }
    
    exitFocusMode() {
        this.focusMode.active = false;
        const overlay = document.getElementById('focus-mode-overlay');
        const focusTextarea = document.getElementById('focus-editor-textarea');
        const mainTextarea = document.getElementById('editor-textarea');
        const focusBtn = document.getElementById('focus-mode-btn');
        
        if (overlay) {
            overlay.classList.add('focus-mode-hidden');
            overlay.classList.remove('focus-mode-active');
        }
        
        // Copy content back to main editor
        if (focusTextarea && mainTextarea && this.selectedNote) {
            const content = focusTextarea.value;
            this.selectedNote.content = content;
            mainTextarea.value = content;
            
            // Re-render main editor
            this.updateEditorContent();
            this.saveNote();
        }
        
        // Show focus mode button again
        if (focusBtn && this.selectedNote) {
            focusBtn.style.display = 'block';
        }
        
        // Focus back on main editor
        if (mainTextarea) {
            mainTextarea.focus();
        }
        
        console.log('🎯 Exited focus mode');
    }
    
    updateFocusStats() {
        const focusTextarea = document.getElementById('focus-editor-textarea');
        const wordCountEl = document.getElementById('focus-word-count');
        const charCountEl = document.getElementById('focus-char-count');
        const progressBar = document.getElementById('focus-progress-bar');
        const goalInput = document.getElementById('focus-word-goal');
        
        if (!focusTextarea) return;
        
        const content = focusTextarea.value;
        const wordCount = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
        const charCount = content.length;
        
        // Update counts
        if (wordCountEl) wordCountEl.textContent = `${wordCount} words`;
        if (charCountEl) charCountEl.textContent = `${charCount} characters`;
        
        // Update progress bar
        const goal = parseInt(goalInput?.value) || this.focusMode.wordGoal;
        if (progressBar && goal > 0) {
            const progress = Math.min((wordCount / goal) * 100, 100);
            progressBar.style.width = `${progress}%`;
            
            // Add milestone effects
            if (progress >= 100) {
                progressBar.classList.add('progress-milestone');
                wordCountEl.classList.add('goal-reached');
                setTimeout(() => {
                    progressBar.classList.remove('progress-milestone');
                    wordCountEl.classList.remove('goal-reached');
                }, 3000);
            }
        }
    }
    
    toggleTypewriterMode() {
        this.focusMode.typewriterMode = !this.focusMode.typewriterMode;
        const focusEditor = document.getElementById('focus-editor');
        
        if (focusEditor) {
            if (this.focusMode.typewriterMode) {
                focusEditor.classList.add('typewriter-mode');
            } else {
                focusEditor.classList.remove('typewriter-mode');
            }
        }
    }
    
    setupFocusModeScrolling() {
        const focusTextarea = document.getElementById('focus-editor-textarea');
        const focusContent = document.getElementById('focus-editor-content');
        
        if (focusTextarea && focusContent) {
            // Sync scrolling between textarea and content
            focusTextarea.addEventListener('scroll', () => {
                focusContent.scrollTop = focusTextarea.scrollTop;
                focusContent.scrollLeft = focusTextarea.scrollLeft;
            });
            
            // Typewriter mode: keep cursor in center
            focusTextarea.addEventListener('input', () => {
                if (this.focusMode.typewriterMode) {
                    const lineHeight = parseFloat(getComputedStyle(focusTextarea).lineHeight);
                    const containerHeight = focusTextarea.clientHeight;
                    const targetScroll = focusTextarea.scrollHeight - (containerHeight / 2);
                    
                    focusTextarea.scrollTop = Math.max(0, targetScroll);
                }
            });
        }
    }
    
    // Quick Capture System
    getQuickCaptureTemplates() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit'
        });
        
        return {
            blank: {
                title: 'Quick Note',
                content: ``,
                tags: []
            },
            todo: {
                title: 'Todo',
                content: `## Todo - ${timeString}\n\n- [ ] `,
                tags: ['todo', 'tasks']
            },
            idea: {
                title: 'Idea',
                content: `## 💡 Idea - ${timeString}\n\n**What:** \n\n**Why:** \n\n**How:** \n\n**Next Steps:**\n- [ ] `,
                tags: ['ideas', 'brainstorm']
            },
            meeting: {
                title: 'Meeting Note',
                content: `## Meeting - ${timeString}\n\n**Attendees:** \n\n**Key Points:**\n- \n\n**Action Items:**\n- [ ] `,
                tags: ['meeting', 'work']
            }
        };
    }
    
    showQuickCapture() {
        const modal = document.getElementById('quick-capture-modal');
        const titleInput = document.getElementById('quick-capture-title');
        const contentTextarea = document.getElementById('quick-capture-content');
        const tagsInput = document.getElementById('quick-capture-tags');
        
        if (modal) {
            this.quickCapture.visible = true;
            modal.style.display = 'flex';
            
            // Clear previous content
            if (titleInput) titleInput.value = '';
            if (contentTextarea) contentTextarea.value = '';
            if (tagsInput) tagsInput.value = '';
            
            // Focus on content area
            setTimeout(() => {
                if (contentTextarea) {
                    contentTextarea.focus();
                }
            }, 100);
            
            console.log('⚡ Quick Capture opened');
        }
    }
    
    hideQuickCapture() {
        const modal = document.getElementById('quick-capture-modal');
        if (modal) {
            this.quickCapture.visible = false;
            modal.style.display = 'none';
            console.log('⚡ Quick Capture closed');
        }
    }
    
    applyQuickCaptureTemplate(templateKey) {
        const template = this.quickCapture.templates[templateKey];
        if (!template) return;
        
        const titleInput = document.getElementById('quick-capture-title');
        const contentTextarea = document.getElementById('quick-capture-content');
        const tagsInput = document.getElementById('quick-capture-tags');
        
        if (titleInput && !titleInput.value) {
            titleInput.value = template.title;
        }
        
        if (contentTextarea) {
            contentTextarea.value = template.content;
            this.updateQuickCaptureCount();
        }
        
        if (tagsInput && template.tags.length > 0) {
            tagsInput.value = template.tags.map(tag => `#${tag}`).join(' ');
        }
    }
    
    updateQuickCaptureCount() {
        const contentTextarea = document.getElementById('quick-capture-content');
        const countElement = document.getElementById('quick-capture-count');
        
        if (contentTextarea && countElement) {
            const content = contentTextarea.value.trim();
            const wordCount = content === '' ? 0 : content.split(/\s+/).length;
            countElement.textContent = `${wordCount} words`;
        }
    }
    
    async saveQuickCapture(closeAfter = true) {
        const titleInput = document.getElementById('quick-capture-title');
        const contentTextarea = document.getElementById('quick-capture-content');
        const tagsInput = document.getElementById('quick-capture-tags');
        
        if (!contentTextarea || !contentTextarea.value.trim()) {
            alert('Please enter some content for your quick note.');
            return;
        }
        
        try {
            // Generate title if empty
            let title = titleInput?.value?.trim() || '';
            if (!title) {
                const content = contentTextarea.value.trim();
                // Use first line or first few words as title
                title = content.split('\n')[0].substring(0, 50) || 'Quick Note';
                // Remove markdown headers
                title = title.replace(/^#+\s*/, '');
            }
            
            // Extract tags from tags input
            let tags = [];
            if (tagsInput?.value) {
                tags = tagsInput.value
                    .split(/\s+/)
                    .map(tag => tag.replace(/^#/, '').trim())
                    .filter(tag => tag.length > 0);
            }
            
            // Create the note
            const note = await window.bearmarkDB.createNote({
                title: title,
                content: contentTextarea.value,
                tags: tags
            });
            
            // Add to notes array and refresh
            this.notes.unshift(note);
            this.filteredNotes = [...this.notes];
            this.renderNotesList();
            
            console.log('⚡ Quick note saved:', title);
            
            // Close modal if requested
            if (closeAfter) {
                this.hideQuickCapture();
            } else {
                // Clear form for next capture
                if (titleInput) titleInput.value = '';
                if (contentTextarea) contentTextarea.value = '';
                if (tagsInput) tagsInput.value = '';
                this.updateQuickCaptureCount();
                
                // Focus back on content
                setTimeout(() => {
                    if (contentTextarea) contentTextarea.focus();
                }, 100);
            }
            
        } catch (error) {
            console.error('Error saving quick note:', error);
            alert('Error saving note. Please try again.');
        }
    }
    
    async saveAndContinueQuickCapture() {
        await this.saveQuickCapture(false);
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
