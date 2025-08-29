// Chrome Extension Storage API adapter for BearMark
class ChromeStorageDB {
    constructor() {
        this.notes = [];
        this.settings = {};
        this.initialized = false;
    }

    // Initialize the storage
    async init() {
        if (this.initialized) return;
        
        try {
            const result = await chrome.storage.local.get(['notes', 'settings']);
            this.notes = result.notes || [];
            this.settings = result.settings || {};
            this.initialized = true;
            console.log('Chrome storage initialized successfully');
        } catch (error) {
            console.error('Error initializing Chrome storage:', error);
            this.notes = [];
            this.settings = {};
            this.initialized = true;
        }
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Create a new note
    async createNote(noteData) {
        await this.init();
        
        const note = {
            id: this.generateId(),
            title: noteData.title || 'Untitled Note',
            content: noteData.content || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: noteData.tags || []
        };

        this.notes.push(note);
        await this.saveNotes();
        return note;
    }

    // Get all notes
    async getAllNotes() {
        await this.init();
        return [...this.notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    // Get note by ID
    async getNoteById(id) {
        await this.init();
        return this.notes.find(note => note.id === id);
    }

    // Update note
    async updateNote(id, updateData) {
        await this.init();
        
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) {
            throw new Error('Note not found');
        }

        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            ...updateData,
            updated_at: new Date().toISOString()
        };

        await this.saveNotes();
        return this.notes[noteIndex];
    }

    // Delete note
    async deleteNote(id) {
        await this.init();
        
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) {
            throw new Error('Note not found');
        }

        this.notes.splice(noteIndex, 1);
        await this.saveNotes();
        return true;
    }

    // Search notes
    async searchNotes(query) {
        await this.init();
        
        if (!query || query.trim() === '') {
            return this.getAllNotes();
        }

        const searchTerm = query.toLowerCase();
        return this.notes
            .filter(note => 
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            )
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    // Save notes to Chrome storage
    async saveNotes() {
        try {
            await chrome.storage.local.set({ notes: this.notes });
        } catch (error) {
            console.error('Error saving notes:', error);
            throw error;
        }
    }

    // Get settings
    async getSettings() {
        await this.init();
        return { ...this.settings };
    }

    // Update settings
    async updateSettings(newSettings) {
        await this.init();
        
        this.settings = { ...this.settings, ...newSettings };
        
        try {
            await chrome.storage.local.set({ settings: this.settings });
            return this.settings;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    // Export data
    async exportData() {
        await this.init();
        
        return {
            notes: this.notes,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    // Import data
    async importData(data) {
        try {
            if (data.notes && Array.isArray(data.notes)) {
                this.notes = data.notes;
            }
            
            if (data.settings && typeof data.settings === 'object') {
                this.settings = data.settings;
            }

            await chrome.storage.local.set({ 
                notes: this.notes, 
                settings: this.settings 
            });
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Clear all data
    async clearAll() {
        this.notes = [];
        this.settings = {};
        
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    // Get storage usage
    async getStorageInfo() {
        try {
            const result = await chrome.storage.local.getBytesInUse();
            return {
                bytesInUse: result,
                notesCount: this.notes.length,
                quota: chrome.storage.local.QUOTA_BYTES || 'Unknown'
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                bytesInUse: 0,
                notesCount: this.notes.length,
                quota: 'Unknown'
            };
        }
    }
}

// Initialize global storage instance
window.bearmarkDB = new ChromeStorageDB();

// Listen for storage changes from other instances
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.notes) {
            // Refresh notes if changed from another instance
            if (window.bearmarkDB) {
                window.bearmarkDB.notes = changes.notes.newValue || [];
            }
        }
    });
}

// Fallback for development/testing without Chrome APIs
if (typeof chrome === 'undefined' || !chrome.storage) {
    console.warn('Chrome storage API not available, using localStorage fallback');
    
    // Simple localStorage fallback for development
    class LocalStorageFallback {
        async init() {
            this.notes = JSON.parse(localStorage.getItem('bearmark_notes') || '[]');
            this.settings = JSON.parse(localStorage.getItem('bearmark_settings') || '{}');
            this.initialized = true;
        }

        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        async createNote(noteData) {
            await this.init();
            const note = {
                id: this.generateId(),
                title: noteData.title || 'Untitled Note',
                content: noteData.content || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                tags: noteData.tags || []
            };
            this.notes.push(note);
            localStorage.setItem('bearmark_notes', JSON.stringify(this.notes));
            return note;
        }

        async getAllNotes() {
            await this.init();
            return [...this.notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        async updateNote(id, updateData) {
            await this.init();
            const noteIndex = this.notes.findIndex(note => note.id === id);
            if (noteIndex === -1) throw new Error('Note not found');
            
            this.notes[noteIndex] = {
                ...this.notes[noteIndex],
                ...updateData,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem('bearmark_notes', JSON.stringify(this.notes));
            return this.notes[noteIndex];
        }

        async deleteNote(id) {
            await this.init();
            const noteIndex = this.notes.findIndex(note => note.id === id);
            if (noteIndex === -1) throw new Error('Note not found');
            
            this.notes.splice(noteIndex, 1);
            localStorage.setItem('bearmark_notes', JSON.stringify(this.notes));
            return true;
        }

        async searchNotes(query) {
            const notes = await this.getAllNotes();
            if (!query || query.trim() === '') return notes;
            
            const searchTerm = query.toLowerCase();
            return notes.filter(note => 
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm)
            );
        }

        async getSettings() {
            await this.init();
            return { ...this.settings };
        }

        async updateSettings(newSettings) {
            await this.init();
            this.settings = { ...this.settings, ...newSettings };
            localStorage.setItem('bearmark_settings', JSON.stringify(this.settings));
            return this.settings;
        }
    }

    window.bearmarkDB = new LocalStorageFallback();
}
