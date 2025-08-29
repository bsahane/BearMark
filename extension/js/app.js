// Main BearMark application logic
function bearmarkApp() {
    console.log('🎯 bearmarkApp() function called');
    const app = {
        // Application state
        notes: [],
        filteredNotes: [],
        selectedNote: null,
        searchQuery: '',
        isLoading: true,
        settings: {},
        sidebarCollapsed: false,
        
        // Unified editor state
        unifiedContent: '',
        isEditorFocused: false,
        
        // Auto-save debounce timer
        autoSaveTimer: null,
        
        // Initialize application
        async init() {
            console.log('🚀 BearMark init() called');
            try {
                this.isLoading = true;
                console.log('📊 Loading state set to true');
                
                // Wait for database to be ready
                if (window.bearmarkDB) {
                    console.log('💾 Database found, loading notes...');
                    await this.loadNotes();
                    await this.loadSettings();
                    console.log('📝 Notes and settings loaded');
                    
                    // Show daily inspiration on first load
                    this.showDailyInspiration();
                } else {
                    console.error('❌ Database not found!');
                }
                
                this.isLoading = false;
                console.log('✅ Loading complete');
                
                // Set up auto-save interval
                this.setupAutoSave();
                
                // Set up overlay event listeners
                setTimeout(() => this.setupOverlayEventListeners(), 100);
                
                console.log('🎉 BearMark initialized successfully');
            } catch (error) {
                console.error('💥 Error initializing app:', error);
                this.isLoading = false;
            }
        },

        // Load all notes from database
        async loadNotes() {
            try {
                this.notes = await window.bearmarkDB.getAllNotes();
                this.filteredNotes = [...this.notes];
                
                // Select first note if available
                if (this.notes.length > 0 && !this.selectedNote) {
                    this.selectedNote = this.notes[0];
                    this.updateUnifiedEditor();
                }
            } catch (error) {
                console.error('Error loading notes:', error);
            }
        },

        // Load settings
        async loadSettings() {
            try {
                this.settings = await window.bearmarkDB.getSettings();
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        },

        // Create new note
        async createNewNote() {
            try {
                const newNote = await window.bearmarkDB.createNote({
                    title: 'Untitled Note',
                    content: '# New Note\n\nStart writing your thoughts here...'
                });
                
                await this.loadNotes();
                this.selectNote(newNote);
                
                // Focus on title input
                setTimeout(() => {
                    const titleInput = document.querySelector('input[x-model="selectedNote.title"]');
                    if (titleInput) {
                        titleInput.focus();
                        titleInput.select();
                    }
                }, 100);
            } catch (error) {
                console.error('Error creating note:', error);
            }
        },

        // Select a note
        selectNote(note) {
            this.selectedNote = note;
            this.updateUnifiedEditor();
        },

        // Save note (debounced)
        saveNote() {
            if (!this.selectedNote) return;
            
            // Clear existing timer
            if (this.autoSaveTimer) {
                clearTimeout(this.autoSaveTimer);
            }
            
            // Set new timer for auto-save
            this.autoSaveTimer = setTimeout(async () => {
                await this.performSave();
            }, 1000); // Save after 1 second of inactivity
        },

        // Perform the actual save operation
        async performSave() {
            if (!this.selectedNote) return;
            
            try {
                await window.bearmarkDB.updateNote(this.selectedNote.id, {
                    title: this.selectedNote.title,
                    content: this.selectedNote.content
                });
                
                // Update local notes array
                const noteIndex = this.notes.findIndex(n => n.id === this.selectedNote.id);
                if (noteIndex !== -1) {
                    this.notes[noteIndex] = { ...this.selectedNote };
                    this.filterNotes();
                }
            } catch (error) {
                console.error('Error saving note:', error);
            }
        },

        // Delete note
        async deleteNote(note) {
            if (!note) return;
            
            if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                try {
                    await window.bearmarkDB.deleteNote(note.id);
                    await this.loadNotes();
                    
                    // Select another note or clear selection
                    if (this.selectedNote?.id === note.id) {
                        this.selectedNote = this.notes.length > 0 ? this.notes[0] : null;
                        this.updateUnifiedEditor();
                    }
                } catch (error) {
                    console.error('Error deleting note:', error);
                }
            }
        },

        // Search notes
        async searchNotes() {
            if (!this.searchQuery.trim()) {
                this.filteredNotes = [...this.notes];
            } else {
                try {
                    this.filteredNotes = await window.bearmarkDB.searchNotes(this.searchQuery);
                } catch (error) {
                    console.error('Error searching notes:', error);
                    this.filteredNotes = this.notes.filter(note => 
                        note.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        note.content.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                }
            }
        },

        // Filter notes locally
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
        },

        // Update unified editor content
        updateUnifiedEditor(event = null) {
            if (!this.selectedNote || !window.markdownProcessor) {
                this.unifiedContent = '';
                return;
            }
            
            try {
                const content = this.selectedNote.content || '';
                this.unifiedContent = this.renderUnifiedMarkdown(content);
                
                // Sync scroll position between textarea and overlay
                if (event && event.target) {
                    this.syncScroll(event.target);
                }
            } catch (error) {
                console.error('Error updating unified editor:', error);
                this.unifiedContent = '<p class="text-red-500">Error rendering content</p>';
            }
        },

        // Sync scroll position between textarea and overlay
        syncScroll(textarea) {
            const overlay = document.querySelector('.unified-editor-content');
            if (overlay && textarea) {
                // Use requestAnimationFrame for smooth scrolling sync
                requestAnimationFrame(() => {
                    overlay.scrollTop = textarea.scrollTop;
                    overlay.scrollLeft = textarea.scrollLeft;
                });
            }
        },

        // Render markdown for unified editor (Bear.app style with cursor alignment)
        renderUnifiedMarkdown(content) {
            if (!content || content.trim() === '') {
                return '';
            }

            // Split content into lines to maintain proper cursor alignment
            const lines = content.split('\n');
            const processedLines = lines.map(line => {
                // Process each line individually to maintain line structure
                let processedLine = line;
                
                // Headers - use subtle styling that doesn't change line height
                if (/^#{1,6}\s+/.test(line)) {
                    const level = line.match(/^(#{1,6})/)[1].length;
                    const text = line.replace(/^#{1,6}\s+/, '');
                    const weight = level <= 2 ? 'font-bold' : level === 3 ? 'font-semibold' : 'font-medium';
                    const color = level === 1 ? 'text-warm-900' : level === 2 ? 'text-warm-800' : 'text-warm-700';
                    
                    // Keep the # symbols visible but styled
                    const hashes = '#'.repeat(level);
                    return `<span class="text-warm-400">${hashes} </span><span class="${weight} ${color}">${text}</span>`;
                }
                
                // Links - simple processing
                processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                    return `<span class="text-warm-400">[</span><span class="markdown-link text-bear-600 underline hover:text-bear-700 cursor-pointer pointer-events-auto font-medium" data-url="${url}">${text}</span><span class="text-warm-400">](${url})</span>`;
                });
                
                // Hashtags - simple processing  
                processedLine = processedLine.replace(/(^|\s)(#\w+)/g, (match, space, hashtag) => {
                    return `${space}<span class="hashtag text-red-700 font-medium cursor-pointer pointer-events-auto hover:text-red-800 underline" data-hashtag="${hashtag}">${hashtag}</span>`;
                });
                
                // Bold text - preserve **
                processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, (match, content) => {
                    return `<span class="text-warm-400">**</span><span class="font-semibold text-warm-900">${content}</span><span class="text-warm-400">**</span>`;
                });
                
                // Italic text - preserve *
                processedLine = processedLine.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (match, content) => {
                    return `<span class="text-warm-400">*</span><span class="italic text-warm-800">${content}</span><span class="text-warm-400">*</span>`;
                });
                
                // Inline code - preserve `
                processedLine = processedLine.replace(/`([^`]+)`/g, (match, content) => {
                    return `<span class="text-warm-400">\`</span><span class="bg-warm-100 text-bear-700 font-mono">${content}</span><span class="text-warm-400">\`</span>`;
                });
                
                // Lists - style bullets  
                if (/^[-*+] /.test(line)) {
                    return processedLine.replace(/^[-*+] /, '<span class="text-bear-500 font-bold">• </span>');
                }
                
                if (/^\d+\. /.test(line)) {
                    return processedLine.replace(/^(\d+)\. /, '<span class="text-bear-500 font-bold">$1. </span>');
                }
                
                // Checkboxes - style checkbox indicators
                if (/^\[ \] /.test(line)) {
                    return processedLine.replace(/^\[ \] /, '<span class="text-bear-500 font-bold">☐ </span>');
                }
                
                if (/^\[x\] /i.test(line)) {
                    return processedLine.replace(/^\[x\] /i, '<span class="text-green-600 font-bold">☑ </span>');
                }
                
                // Table rows - style all pipe characters consistently
                if (/\|/.test(line)) {
                    // Style all pipes in table rows consistently
                    return processedLine.replace(/\|/g, '<span class="text-red-700">|</span>');
                }
                
                // Blockquotes
                if (/^> /.test(line)) {
                    return processedLine.replace(/^> /, '<span class="text-bear-400 font-bold">▍ </span><span class="italic text-warm-600">').replace(/$/, '</span>');
                }
                
                return processedLine;
            });
            
            // Join lines back together, preserving line breaks (no table processing)
            return processedLines.join('\n');
        },



        // Handle editor keydown events
        handleEditorKeydown(event) {
            // Handle common markdown shortcuts
            if (event.metaKey || event.ctrlKey) {
                switch(event.key) {
                    case 'b':
                        event.preventDefault();
                        this.wrapSelectedText('**', '**');
                        break;
                    case 'i':
                        event.preventDefault();
                        this.wrapSelectedText('*', '*');
                        break;
                    case 'k':
                        event.preventDefault();
                        this.wrapSelectedText('[', '](url)');
                        break;

                }
            }
            
            // Handle Tab key for table navigation
            if (event.key === 'Tab') {
                if (this.handleTableTab(event)) {
                    return; // Tab was handled by table navigation
                }
            }
            
            // Handle Enter key for auto bullet points and checkboxes
            if (event.key === 'Enter') {
                this.handleEnterKey(event);
            }
            
            // Auto-format headers and bullets
            if (event.key === ' ') {
                this.autoFormatLine(event);
            }
            
            // Table shortcuts
            if (event.altKey) {
                switch(event.key) {
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.moveTableColumn(-1);
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.moveTableColumn(1);
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        this.moveTableRow(-1);
                        break;
                    case 'ArrowDown':
                        event.preventDefault();
                        this.moveTableRow(1);
                        break;
                }
            }
            
            if (event.altKey && event.shiftKey) {
                switch(event.key) {
                    case 'ArrowLeft':
                        event.preventDefault();
                        this.deleteTableColumn();
                        break;
                    case 'ArrowRight':
                        event.preventDefault();
                        this.insertTableColumn();
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        this.deleteTableRow();
                        break;
                    case 'ArrowDown':
                        event.preventDefault();
                        this.insertTableRow();
                        break;
                }
            }
            

        },

        // Wrap selected text with markdown syntax
        wrapSelectedText(prefix, suffix) {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = this.selectedNote.content.substring(start, end);
            const newText = prefix + selectedText + suffix;
            
            this.selectedNote.content = 
                this.selectedNote.content.substring(0, start) + 
                newText + 
                this.selectedNote.content.substring(end);
            
            // Update cursor position
            setTimeout(() => {
                textarea.selectionStart = start + prefix.length;
                textarea.selectionEnd = start + prefix.length + selectedText.length;
                textarea.focus();
            }, 0);
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Handle Enter key for auto bullets and checkboxes
        handleEnterKey(event) {
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            
            // Find the current line
            const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
            const lineEnd = content.indexOf('\n', cursorPos);
            const currentLine = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
            
            // Check if current line is a bullet point or checkbox
            const bulletMatch = currentLine.match(/^(\s*)([-*+])\s/);
            const checkboxMatch = currentLine.match(/^(\s*)\[(\s|x|X)\]\s/);
            
            if (bulletMatch) {
                // Continue bullet point
                event.preventDefault();
                const indent = bulletMatch[1];
                const bullet = bulletMatch[2];
                
                // If the line only contains the bullet (empty), remove it and exit bullet mode
                if (currentLine.trim() === bullet) {
                    // Remove the bullet and don't add a new one
                    const newContent = content.substring(0, lineStart) + indent + content.substring(cursorPos);
                    this.selectedNote.content = newContent;
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length;
                        textarea.focus();
                    }, 0);
                } else {
                    // Add new bullet point
                    const newBullet = `\n${indent}${bullet} `;
                    const newContent = content.substring(0, cursorPos) + newBullet + content.substring(cursorPos);
                    this.selectedNote.content = newContent;
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = cursorPos + newBullet.length;
                        textarea.focus();
                    }, 0);
                }
                
                this.updateUnifiedEditor();
                this.saveNote();
            } else if (checkboxMatch) {
                // Continue checkbox
                event.preventDefault();
                const indent = checkboxMatch[1];
                
                // If the line only contains the checkbox (empty), remove it and exit checkbox mode
                if (currentLine.trim() === '[ ]' || currentLine.trim() === '[x]' || currentLine.trim() === '[X]') {
                    // Remove the checkbox and don't add a new one
                    const newContent = content.substring(0, lineStart) + indent + content.substring(cursorPos);
                    this.selectedNote.content = newContent;
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = lineStart + indent.length;
                        textarea.focus();
                    }, 0);
                } else {
                    // Add new checkbox
                    const newCheckbox = `\n${indent}[ ] `;
                    const newContent = content.substring(0, cursorPos) + newCheckbox + content.substring(cursorPos);
                    this.selectedNote.content = newContent;
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = cursorPos + newCheckbox.length;
                        textarea.focus();
                    }, 0);
                }
                
                this.updateUnifiedEditor();
                this.saveNote();
            }
        },

        // Auto-format lines (headers, lists, etc.)
        autoFormatLine(event) {
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            
            // Find the current line
            const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
            const currentLine = content.substring(lineStart, cursorPos);
            
            // Check for header pattern (1-6 # followed by space)
            const headerMatch = currentLine.match(/^(#{1,6})$/);
            if (headerMatch) {
                // Already handled by the space key, just update the display
                this.updateUnifiedEditor();
            }
            
            // Auto-convert "- " to bullet point
            if (currentLine === '-') {
                event.preventDefault();
                // Replace "- " with "- " and update cursor
                const beforeLine = content.substring(0, lineStart);
                const afterCursor = content.substring(cursorPos);
                this.selectedNote.content = beforeLine + '- ' + afterCursor;
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
                    textarea.focus();
                }, 0);
                this.updateUnifiedEditor();
                this.saveNote();
            }
            
            // Auto-convert "[ ]" to checkbox
            if (currentLine === '[ ]') {
                event.preventDefault();
                // Just add the space and update
                const beforeLine = content.substring(0, lineStart);
                const afterCursor = content.substring(cursorPos);
                this.selectedNote.content = beforeLine + '[ ] ' + afterCursor;
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = lineStart + 4;
                    textarea.focus();
                }, 0);
                this.updateUnifiedEditor();
                this.saveNote();
            }
        },

        // Handle table tab navigation
        handleTableTab(event) {
            const textarea = event.target;
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            
            // Check if we're in a table
            const currentLine = this.getCurrentLine(content, cursorPos);
            if (!currentLine.includes('|')) {
                return false; // Not in a table
            }
            
            event.preventDefault();
            
            if (event.shiftKey) {
                // Move to previous cell
                this.moveToPreviousTableCell(textarea, content, cursorPos);
            } else {
                // Move to next cell
                this.moveToNextTableCell(textarea, content, cursorPos);
            }
            
            return true; // Tab was handled
        },

        // Get current line from content and cursor position
        getCurrentLine(content, cursorPos) {
            const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
            const lineEnd = content.indexOf('\n', cursorPos);
            return content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        },

        // Move to next table cell
        moveToNextTableCell(textarea, content, cursorPos) {
            // Find next pipe character
            let nextPipe = content.indexOf('|', cursorPos);
            
            if (nextPipe === -1) {
                // No more pipes, create new row
                this.insertTableRow();
                return;
            }
            
            // Move cursor after the pipe
            nextPipe += 1;
            
            // Skip whitespace
            while (nextPipe < content.length && content[nextPipe] === ' ') {
                nextPipe++;
            }
            
            textarea.selectionStart = textarea.selectionEnd = nextPipe;
            this.formatCurrentTable();
        },

        // Move to previous table cell
        moveToPreviousTableCell(textarea, content, cursorPos) {
            // Find previous pipe character
            let prevPipe = content.lastIndexOf('|', cursorPos - 1);
            
            if (prevPipe === -1) {
                return; // No previous pipe
            }
            
            // Find the pipe before that
            let startPipe = content.lastIndexOf('|', prevPipe - 1);
            if (startPipe === -1) {
                startPipe = content.lastIndexOf('\n', prevPipe - 1) + 1;
            } else {
                startPipe += 1;
            }
            
            // Skip whitespace
            while (startPipe < prevPipe && content[startPipe] === ' ') {
                startPipe++;
            }
            
            textarea.selectionStart = textarea.selectionEnd = startPipe;
        },

        // Insert table row
        insertTableRow() {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            const currentLine = this.getCurrentLine(content, cursorPos);
            
            if (!currentLine.includes('|')) return;
            
            // Count columns in current row
            const columns = currentLine.split('|').length - 1;
            
            // Create new row
            const newRow = '\n|' + ' '.repeat(10) + '|'.repeat(columns - 1);
            
            // Find end of current line
            const lineEnd = content.indexOf('\n', cursorPos);
            const insertPos = lineEnd === -1 ? content.length : lineEnd;
            
            // Insert new row
            this.selectedNote.content = content.substring(0, insertPos) + newRow + content.substring(insertPos);
            
            // Move cursor to new row
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = insertPos + 2;
                textarea.focus();
                this.formatCurrentTable();
            }, 0);
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Insert table column
        insertTableColumn() {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            
            // Find current table
            const table = this.findCurrentTable(content, cursorPos);
            if (!table) return;
            
            // Find current column position
            const currentLine = this.getCurrentLine(content, cursorPos);
            const columnIndex = this.getCurrentColumnIndex(currentLine, cursorPos - (content.lastIndexOf('\n', cursorPos - 1) + 1));
            
            // Insert column in all rows of the table
            const newContent = this.insertColumnInTable(content, table, columnIndex);
            this.selectedNote.content = newContent;
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Delete table row
        deleteTableRow() {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            const currentLine = this.getCurrentLine(content, cursorPos);
            
            if (!currentLine.includes('|')) return;
            
            // Find line boundaries
            const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
            const lineEnd = content.indexOf('\n', cursorPos);
            const endPos = lineEnd === -1 ? content.length : lineEnd + 1;
            
            // Remove the line
            this.selectedNote.content = content.substring(0, lineStart) + content.substring(endPos);
            
            // Adjust cursor position
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = Math.max(0, lineStart - 1);
                textarea.focus();
            }, 0);
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Delete table column
        deleteTableColumn() {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            
            // Find current table
            const table = this.findCurrentTable(content, cursorPos);
            if (!table) return;
            
            // Find current column position
            const currentLine = this.getCurrentLine(content, cursorPos);
            const columnIndex = this.getCurrentColumnIndex(currentLine, cursorPos - (content.lastIndexOf('\n', cursorPos - 1) + 1));
            
            // Delete column from all rows of the table
            const newContent = this.deleteColumnFromTable(content, table, columnIndex);
            this.selectedNote.content = newContent;
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Move table column
        moveTableColumn(direction) {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            
            // Find current table
            const table = this.findCurrentTable(content, cursorPos);
            if (!table) return;
            
            // Find current column position
            const currentLine = this.getCurrentLine(content, cursorPos);
            const columnIndex = this.getCurrentColumnIndex(currentLine, cursorPos - (content.lastIndexOf('\n', cursorPos - 1) + 1));
            
            // Move column in all rows of the table
            const newContent = this.moveColumnInTable(content, table, columnIndex, direction);
            this.selectedNote.content = newContent;
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Move table row
        moveTableRow(direction) {
            const textarea = document.querySelector('textarea[x-model="selectedNote.content"]');
            if (!textarea) return;
            
            const cursorPos = textarea.selectionStart;
            const content = this.selectedNote.content;
            const currentLine = this.getCurrentLine(content, cursorPos);
            
            if (!currentLine.includes('|')) return;
            
            // Find current and target line positions
            const lineStart = content.lastIndexOf('\n', cursorPos - 1) + 1;
            const lineEnd = content.indexOf('\n', cursorPos);
            const currentLineContent = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
            
            if (direction === -1) {
                // Move up
                const prevLineEnd = lineStart - 1;
                if (prevLineEnd < 0) return;
                
                const prevLineStart = content.lastIndexOf('\n', prevLineEnd - 1) + 1;
                const prevLineContent = content.substring(prevLineStart, prevLineEnd);
                
                if (!prevLineContent.includes('|')) return;
                
                // Swap lines
                const newContent = content.substring(0, prevLineStart) + 
                                 currentLineContent + '\n' + 
                                 prevLineContent + 
                                 content.substring(lineEnd === -1 ? content.length : lineEnd);
                
                this.selectedNote.content = newContent;
                
                // Move cursor to new position
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = prevLineStart + (cursorPos - lineStart);
                    textarea.focus();
                }, 0);
                
            } else {
                // Move down
                if (lineEnd === -1) return;
                
                const nextLineStart = lineEnd + 1;
                const nextLineEnd = content.indexOf('\n', nextLineStart);
                const nextLineContent = content.substring(nextLineStart, nextLineEnd === -1 ? content.length : nextLineEnd);
                
                if (!nextLineContent.includes('|')) return;
                
                // Swap lines
                const newContent = content.substring(0, lineStart) + 
                                 nextLineContent + '\n' + 
                                 currentLineContent + 
                                 content.substring(nextLineEnd === -1 ? content.length : nextLineEnd);
                
                this.selectedNote.content = newContent;
                
                // Move cursor to new position
                setTimeout(() => {
                    const newPos = lineStart + nextLineContent.length + 1 + (cursorPos - lineStart);
                    textarea.selectionStart = textarea.selectionEnd = newPos;
                    textarea.focus();
                }, 0);
            }
            
            this.updateUnifiedEditor();
            this.saveNote();
        },

        // Format current table
        formatCurrentTable() {
            // This would implement auto-alignment of table columns
            // For now, just update the editor
            this.updateUnifiedEditor();
        },

        // Find current table boundaries
        findCurrentTable(content, cursorPos) {
            // Implementation to find table start and end
            // This is a simplified version
            return { start: 0, end: content.length };
        },

        // Get current column index in table
        getCurrentColumnIndex(line, cursorPos) {
            let columnIndex = 0;
            for (let i = 0; i < cursorPos && i < line.length; i++) {
                if (line[i] === '|') {
                    columnIndex++;
                }
            }
            return columnIndex;
        },

        // Insert column in table
        insertColumnInTable(content, table, columnIndex) {
            // Simplified implementation
            return content;
        },

        // Delete column from table  
        deleteColumnFromTable(content, table, columnIndex) {
            // Simplified implementation
            return content;
        },

        // Move column in table
        moveColumnInTable(content, table, columnIndex, direction) {
            // Simplified implementation
            return content;
        },

        // Handle editor click events for proper cursor positioning
        handleEditorClick(event) {
            // Ensure the textarea maintains focus and cursor position
            const textarea = event.target;
            if (textarea) {
                // Force focus if not already focused
                if (document.activeElement !== textarea) {
                    textarea.focus();
                }
                
                // Sync any scroll position changes
                this.syncScroll(textarea);
            }
        },

        // Setup event delegation for clickable elements in the overlay
        setupOverlayEventListeners() {
            // Use arrow function to preserve 'this' context
            const self = this;
            
            document.addEventListener('click', (event) => {
                // Handle hashtag clicks - Cmd+Click or Ctrl+Click for search
                if (event.target.classList && event.target.classList.contains('hashtag')) {
                    if (event.metaKey || event.ctrlKey) {
                        event.preventDefault();
                        const hashtag = event.target.getAttribute('data-hashtag');
                        if (hashtag) {
                            self.filterByHashtag(hashtag);
                        }
                    }
                }

                // Handle link clicks - Cmd+Click or Ctrl+Click to open in new tab
                if (event.target.classList && event.target.classList.contains('markdown-link')) {
                    if (event.metaKey || event.ctrlKey) {
                        event.preventDefault();
                        const url = event.target.getAttribute('data-url');
                        if (url && self.isValidUrl(url)) {
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }
                    }
                }
            });
        },

        // Validate URL for security
        isValidUrl(url) {
            try {
                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                return ['http:', 'https:'].includes(urlObj.protocol);
            } catch {
                return false;
            }
        },

        // Escape HTML for safe rendering
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        // Export note
        async exportNote() {
            if (!this.selectedNote) return;
            
            try {
                const title = this.selectedNote.title || 'Untitled';
                const content = this.selectedNote.content;
                
                // Create download link
                const element = document.createElement('a');
                const file = new Blob([content], { type: 'text/markdown' });
                element.href = URL.createObjectURL(file);
                element.download = `${title}.md`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                
                // Clean up
                URL.revokeObjectURL(element.href);
            } catch (error) {
                console.error('Error exporting note:', error);
            }
        },

        // Format date for display
        formatDate(dateString) {
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffInMs = now - date;
                const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                
                if (diffInDays === 0) {
                    return 'Today';
                } else if (diffInDays === 1) {
                    return 'Yesterday';
                } else if (diffInDays < 7) {
                    return `${diffInDays} days ago`;
                } else {
                    return date.toLocaleDateString();
                }
            } catch (error) {
                return 'Unknown';
            }
        },

        // Show daily inspiration
        showDailyInspiration() {
            const inspirations = [
                "🌅 Every word you write is a step forward in your journey.",
                "✨ Great ideas often come from simple beginnings.",
                "🎯 Focus on progress, not perfection.",
                "🌱 Let your thoughts grow on the page.",
                "💡 Today's draft is tomorrow's masterpiece.",
                "🚀 Your unique perspective matters to the world.",
                "🎨 Creativity flows when you start writing.",
                "📝 Every expert was once a beginner with a blank page."
            ];
            
            const today = new Date().toDateString();
            const lastInspiration = localStorage.getItem('bearmark_last_inspiration');
            
            if (lastInspiration !== today) {
                const randomInspiration = inspirations[Math.floor(Math.random() * inspirations.length)];
                
                // Show inspiration in console for now
                // TODO: Implement proper notification/modal system
                console.log('Daily Inspiration:', randomInspiration);
                
                localStorage.setItem('bearmark_last_inspiration', today);
                localStorage.setItem('bearmark_today_inspiration', randomInspiration);
            }
        },

        // Setup auto-save
        setupAutoSave() {
            // Save every 30 seconds if there are unsaved changes
            setInterval(() => {
                if (this.selectedNote && this.autoSaveTimer) {
                    this.performSave();
                }
            }, 30000);
        },



        // Keyboard shortcuts
        handleKeydown(event) {
            // Cmd/Ctrl + N: New note
            if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
                event.preventDefault();
                this.createNewNote();
            }
            
            // Cmd/Ctrl + S: Save note
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault();
                this.performSave();
            }
            
            // Cmd/Ctrl + F: Focus search
            if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
                event.preventDefault();
                const searchInput = document.querySelector('input[x-model="searchQuery"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Cmd/Ctrl + E: Export note
            if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
                event.preventDefault();
                this.exportNote();
            }
        },

        // Filter notes by hashtag
        filterByHashtag(hashtag) {
            this.searchQuery = hashtag;
            this.searchNotes();
        },

        // Computed properties
        get hasNotes() {
            return this.notes.length > 0;
        },

        get currentNoteIndex() {
            if (!this.selectedNote) return -1;
            return this.notes.findIndex(note => note.id === this.selectedNote.id);
        },

        get canNavigateNext() {
            return this.currentNoteIndex < this.notes.length - 1;
        },

        get canNavigatePrevious() {
            return this.currentNoteIndex > 0;
        }
    };
    
    console.log('✅ Returning app object with properties:', Object.keys(app));
    return app;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add global keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Access Alpine.js data through the global scope
        const app = window.Alpine?.raw?.(document.querySelector('[x-data]')?._x_dataStack?.[0]);
        if (app && typeof app.handleKeydown === 'function') {
            app.handleKeydown(event);
        }
    });
    
    console.log('BearMark app loaded');
});

// Global functions for interactive elements in rendered content
window.filterByHashtag = function(hashtag) {
    const app = window.Alpine?.raw?.(document.querySelector('[x-data]')?._x_dataStack?.[0]);
    if (app && typeof app.filterByHashtag === 'function') {
        app.filterByHashtag(hashtag);
    }
};

window.handleLinkClick = function(event, url) {
    // Handle Cmd+Click or Ctrl+Click to open in new tab
    if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        // Normal click - let the browser handle it
        return true;
    }
};

// Handle before unload to save any pending changes
window.addEventListener('beforeunload', () => {
    const app = window.Alpine?.raw?.(document.querySelector('[x-data]')?._x_dataStack?.[0]);
    if (app && app.selectedNote && app.autoSaveTimer) {
        app.performSave();
    }
});
