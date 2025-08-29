// Popup script for BearMark Chrome Extension

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize popup
    await initializePopup();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load stats
    await loadStats();
});

// Initialize popup
async function initializePopup() {
    console.log('BearMark popup initialized');
}

// Set up event listeners
function setupEventListeners() {
    // New tab button
    document.getElementById('newTabBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://newtab/' });
        window.close();
    });
    
    // Quick note button
    document.getElementById('quickNoteBtn').addEventListener('click', async () => {
        const tab = await chrome.tabs.create({ url: 'chrome://newtab/' });
        
        // Send message to create a new note immediately
        setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'createQuickNote'
            });
        }, 1000);
        
        window.close();
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', async () => {
        await exportNotes();
    });
    
    // Help link
    document.getElementById('helpLink').addEventListener('click', (e) => {
        e.preventDefault();
        showKeyboardShortcuts();
    });
}

// Load stats
async function loadStats() {
    try {
        const loading = document.getElementById('loading');
        const statsContent = document.getElementById('statsContent');
        
        // Get notes from storage
        const result = await chrome.storage.local.get(['notes']);
        const notes = result.notes || [];
        
        // Get storage info
        const bytesInUse = await chrome.storage.local.getBytesInUse();
        
        // Update stats
        document.getElementById('noteCount').textContent = notes.length;
        document.getElementById('storageUsed').textContent = formatBytes(bytesInUse);
        
        // Find last updated note
        if (notes.length > 0) {
            const lastUpdated = notes.reduce((latest, note) => {
                return new Date(note.updated_at) > new Date(latest.updated_at) ? note : latest;
            });
            document.getElementById('lastUpdated').textContent = formatRelativeTime(lastUpdated.updated_at);
        } else {
            document.getElementById('lastUpdated').textContent = 'No notes yet';
        }
        
        // Hide loading, show stats
        loading.style.display = 'none';
        statsContent.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('loading').textContent = 'Error loading stats';
    }
}

// Export notes
async function exportNotes() {
    try {
        const result = await chrome.storage.local.get(['notes', 'settings']);
        const exportData = {
            notes: result.notes || [],
            settings: result.settings || {},
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        // Create download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Download file
        const filename = `bearmark-export-${new Date().toISOString().split('T')[0]}.json`;
        
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download error:', chrome.runtime.lastError);
                showNotification('Export failed', 'error');
            } else {
                showNotification('Notes exported successfully!', 'success');
                URL.revokeObjectURL(url);
            }
        });
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed', 'error');
    }
}

// Show keyboard shortcuts
function showKeyboardShortcuts() {
    const shortcuts = [
        'Ctrl+Shift+B (Cmd+Shift+B on Mac) - Open BearMark',
        'Ctrl+B/Cmd+B - Bold text',
        'Ctrl+I/Cmd+I - Italic text', 
        'Ctrl+K/Cmd+K - Create link',
        'Tab - Navigate table cells',
        'Alt+Arrow - Move table columns/rows',
        'Alt+Shift+Arrow - Insert/delete table elements',
        '- + Space - Auto bullet points',
        '[ ] + Space - Auto checkboxes'
    ];
    
    alert('BearMark Keyboard Shortcuts:\n\n' + shortcuts.join('\n'));
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 12px 16px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : 'background: #ef4444;'}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours === 0) {
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
        }
        return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
