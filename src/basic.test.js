// Basic tests for BearMark functionality
import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = value.toString();
  },
  removeItem: function(key) {
    delete this.store[key];
  },
  clear: function() {
    this.store = {};
  }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Import the database class
import '../src/js/database.js';
import '../src/js/markdown.js';

describe('BearMarkDB', () => {
  let db;

  beforeEach(() => {
    localStorageMock.clear();
    db = new BearMarkDB();
  });

  it('should initialize with empty notes', async () => {
    const notes = await db.getAllNotes();
    expect(notes).toEqual([]);
  });

  it('should create a new note', async () => {
    const noteData = {
      title: 'Test Note',
      content: '# Test Content'
    };
    
    const newNote = await db.createNote(noteData);
    
    expect(newNote.id).toBeDefined();
    expect(newNote.title).toBe('Test Note');
    expect(newNote.content).toBe('# Test Content');
    expect(newNote.createdAt).toBeDefined();
    expect(newNote.updatedAt).toBeDefined();
  });

  it('should update an existing note', async () => {
    const newNote = await db.createNote({
      title: 'Original Title',
      content: 'Original content'
    });
    
    const updatedNote = await db.updateNote(newNote.id, {
      title: 'Updated Title',
      content: 'Updated content'
    });
    
    expect(updatedNote.title).toBe('Updated Title');
    expect(updatedNote.content).toBe('Updated content');
    expect(new Date(updatedNote.updatedAt).getTime()).toBeGreaterThan(
      new Date(updatedNote.createdAt).getTime()
    );
  });

  it('should delete a note', async () => {
    const newNote = await db.createNote({
      title: 'To be deleted',
      content: 'This will be deleted'
    });
    
    await db.deleteNote(newNote.id);
    
    const notes = await db.getAllNotes();
    expect(notes).toHaveLength(0);
  });

  it('should search notes by title and content', async () => {
    await db.createNote({
      title: 'JavaScript Tutorial',
      content: 'Learn JavaScript basics'
    });
    
    await db.createNote({
      title: 'Python Guide',
      content: 'Python programming guide'
    });
    
    const jsResults = await db.searchNotes('JavaScript');
    expect(jsResults).toHaveLength(1);
    expect(jsResults[0].title).toBe('JavaScript Tutorial');
    
    const progResults = await db.searchNotes('programming');
    expect(progResults).toHaveLength(1);
    expect(progResults[0].title).toBe('Python Guide');
  });

  it('should generate preview text', () => {
    const markdown = '# Title\n\nThis is **bold** text with [a link](https://example.com).\n\n- List item 1\n- List item 2';
    const preview = db.generatePreview(markdown);
    
    expect(preview).toBe('Title This is bold text with a link. List item 1 List item 2');
  });
});

describe('MarkdownProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new MarkdownProcessor();
  });

  it('should process basic markdown', () => {
    const markdown = '# Heading\n\nThis is **bold** text.';
    const html = processor.simpleMarkdownParse(markdown);
    
    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('should extract metadata', () => {
    const markdown = '# Main Title\n\n## Subtitle\n\nSome content here with multiple words for testing.';
    const metadata = processor.extractMetadata(markdown);
    
    expect(metadata.title).toBe('Main Title');
    expect(metadata.wordCount).toBeGreaterThan(0);
    expect(metadata.headers).toHaveLength(2);
    expect(metadata.headers[0].level).toBe(1);
    expect(metadata.headers[1].level).toBe(2);
  });

  it('should convert to plain text', () => {
    const markdown = '# Title\n\nThis is **bold** text with [a link](https://example.com).';
    const plainText = processor.toPlainText(markdown);
    
    expect(plainText).not.toContain('#');
    expect(plainText).not.toContain('**');
    expect(plainText).not.toContain('[');
    expect(plainText).toContain('Title');
    expect(plainText).toContain('bold');
    expect(plainText).toContain('a link');
  });

  it('should handle empty content', () => {
    const html = processor.parse('');
    expect(html).toContain('Start writing to see preview');
  });
});
