// Markdown processing using marked.js
class MarkdownProcessor {
    constructor() {
        this.initializeMarked();
    }

    initializeMarked() {
        // Configure marked.js options
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                highlight: function(code, lang) {
                    // Basic syntax highlighting placeholder
                    // In production, integrate with Prism.js
                    return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`;
                }.bind(this),
                langPrefix: 'hljs language-',
                breaks: true,
                gfm: true,
                sanitize: false,
                smartLists: true,
                smartypants: true
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    parse(markdown) {
        if (!markdown || markdown.trim() === '') {
            return '<p class="text-warm-500 italic">Start writing to see preview...</p>';
        }

        try {
            if (typeof marked !== 'undefined') {
                return marked.parse(markdown);
            } else {
                // Fallback simple markdown parsing
                return this.simpleMarkdownParse(markdown);
            }
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return `<p class="text-red-500">Error parsing markdown: ${error.message}</p>`;
        }
    }

    // Simple fallback markdown parser
    simpleMarkdownParse(markdown) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Inline code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Code blocks
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Unordered lists
        html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
        
        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<[^>]+>)/g, '$1');
        html = html.replace(/(<\/[^>]+>)<\/p>/g, '$1');
        
        return html;
    }

    // Extract metadata from markdown
    extractMetadata(markdown) {
        const lines = markdown.split('\n');
        const metadata = {
            title: '',
            wordCount: 0,
            characterCount: 0,
            readingTime: 0,
            headers: []
        };

        // Extract title (first header)
        for (const line of lines) {
            if (line.startsWith('#')) {
                metadata.title = line.replace(/^#+\s+/, '').trim();
                break;
            }
        }

        // Word and character count
        const text = markdown.replace(/[#*`\[\]()]/g, '').trim();
        metadata.characterCount = text.length;
        metadata.wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        
        // Reading time (average 200 words per minute)
        metadata.readingTime = Math.ceil(metadata.wordCount / 200);

        // Extract headers
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        while ((match = headerRegex.exec(markdown)) !== null) {
            metadata.headers.push({
                level: match[1].length,
                text: match[2].trim(),
                id: this.generateHeaderId(match[2])
            });
        }

        return metadata;
    }

    generateHeaderId(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    // Table of contents generation
    generateTableOfContents(markdown) {
        const metadata = this.extractMetadata(markdown);
        if (metadata.headers.length === 0) {
            return '';
        }

        let toc = '<div class="table-of-contents"><h3>Table of Contents</h3><ul>';
        
        for (const header of metadata.headers) {
            const indent = '  '.repeat(header.level - 1);
            toc += `${indent}<li><a href="#${header.id}">${header.text}</a></li>`;
        }
        
        toc += '</ul></div>';
        return toc;
    }

    // Export to different formats
    toHtml(markdown, options = {}) {
        const html = this.parse(markdown);
        
        if (options.standalone) {
            return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Exported Note'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 2px; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
        }
        
        return html;
    }

    toPlainText(markdown) {
        return markdown
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/^\s*[-*+]\s+/gm, '• ')
            .replace(/^\s*\d+\.\s+/gm, '1. ')
            .trim();
    }
}

// Create global markdown processor instance
window.markdownProcessor = new MarkdownProcessor();
