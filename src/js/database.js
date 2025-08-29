// Database management using localStorage as fallback for SQLite
class BearMarkDB {
    constructor() {
        this.dbName = 'bearmark_notes';
        this.storageKey = 'bearmark_data';
        this.init();
    }

    async init() {
        // For now, we'll use localStorage as SQLite in browser requires additional setup
        // TODO: Implement sql.js integration in future iteration
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                notes: [],
                settings: {
                    theme: 'light',
                    showPreview: true,
                    autoSave: true,
                },
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { notes: [], settings: {} };
        } catch (error) {
            console.error('Error reading data:', error);
            return { notes: [], settings: {} };
        }
    }

    saveData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Notes CRUD operations
    async getAllNotes() {
        const data = this.getData();
        return data.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    async getNoteById(id) {
        const data = this.getData();
        return data.notes.find(note => note.id === id);
    }

    async createNote(noteData = {}) {
        const data = this.getData();
        const newNote = {
            id: this.generateId(),
            title: noteData.title || '',
            content: noteData.content || '',
            preview: this.generatePreview(noteData.content || ''),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: noteData.tags || [],
            ...noteData
        };
        
        data.notes.push(newNote);
        this.saveData(data);
        return newNote;
    }

    async updateNote(id, updates) {
        const data = this.getData();
        const noteIndex = data.notes.findIndex(note => note.id === id);
        
        if (noteIndex === -1) {
            throw new Error('Note not found');
        }
        
        const updatedNote = {
            ...data.notes[noteIndex],
            ...updates,
            preview: this.generatePreview(updates.content || data.notes[noteIndex].content),
            updatedAt: new Date().toISOString()
        };
        
        data.notes[noteIndex] = updatedNote;
        this.saveData(data);
        return updatedNote;
    }

    async deleteNote(id) {
        const data = this.getData();
        const noteIndex = data.notes.findIndex(note => note.id === id);
        
        if (noteIndex === -1) {
            throw new Error('Note not found');
        }
        
        data.notes.splice(noteIndex, 1);
        this.saveData(data);
        return true;
    }

    async searchNotes(query) {
        const data = this.getData();
        if (!query || query.trim() === '') {
            return data.notes;
        }
        
        const searchTerm = query.toLowerCase().trim();
        return data.notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // Settings
    async getSettings() {
        const data = this.getData();
        return data.settings || {};
    }

    async updateSettings(newSettings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
        return data.settings;
    }

    // Utility methods
    generatePreview(content, maxLength = 150) {
        // Remove markdown syntax for preview
        let preview = content
            .replace(/^#{1,6}\s+/gm, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
            .replace(/`(.*?)`/g, '$1') // Remove inline code
            .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
            .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .trim();
        
        return preview.length > maxLength 
            ? preview.substring(0, maxLength) + '...'
            : preview;
    }

    // Export/Import functionality
    async exportData() {
        const data = this.getData();
        const exportData = {
            notes: data.notes,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    async importData(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            if (!importedData.notes || !Array.isArray(importedData.notes)) {
                throw new Error('Invalid data format');
            }
            
            const data = this.getData();
            // Merge imported notes with existing ones, avoiding duplicates
            const existingIds = new Set(data.notes.map(note => note.id));
            const newNotes = importedData.notes.filter(note => !existingIds.has(note.id));
            
            data.notes = [...data.notes, ...newNotes];
            this.saveData(data);
            return newNotes.length;
        } catch (error) {
            throw new Error('Failed to import data: ' + error.message);
        }
    }
}

// Create global database instance
window.bearmarkDB = new BearMarkDB();
