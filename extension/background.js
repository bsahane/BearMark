// Background service worker for BearMark Chrome Extension

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('BearMark extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // First time installation
        chrome.storage.local.set({
            notes: [],
            settings: {
                theme: 'light',
                autoSave: true,
                fontSize: 'medium'
            }
        });
        
        // Open welcome page (new tab)
        chrome.tabs.create({ url: 'chrome://newtab/' });
    }
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // Open new tab with BearMark
    chrome.tabs.create({ url: 'chrome://newtab/' });
});

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'bearmark-new-note',
        title: 'Create new note in BearMark',
        contexts: ['selection', 'page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'bearmark-new-note') {
        // Create a new note with selected text
        const selectedText = info.selectionText || '';
        
        chrome.tabs.create({ 
            url: 'chrome://newtab/',
            active: true
        }, (newTab) => {
            // Send message to new tab to create note with selected text
            setTimeout(() => {
                chrome.tabs.sendMessage(newTab.id, {
                    action: 'createNoteWithText',
                    text: selectedText,
                    sourceUrl: tab.url,
                    sourceTitle: tab.title
                });
            }, 1000); // Wait for tab to load
        });
    }
});

// Handle keyboard shortcuts
if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener((command) => {
        switch(command) {
            case 'open-bearmark':
                chrome.tabs.create({ url: 'chrome://newtab/' });
                break;
            case 'quick-note':
                chrome.tabs.create({ 
                    url: 'chrome://newtab/',
                    active: true 
                });
                break;
        }
    });
} else {
    console.log('Commands API not available');
}

// Data backup and sync (optional future feature)
const scheduleBackup = () => {
    chrome.alarms.create('backup', { periodInMinutes: 60 });
};

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'backup') {
        // Future: implement cloud backup
        console.log('Backup scheduled (not implemented yet)');
    }
});

// Handle messages from content scripts or new tab page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.action) {
        case 'exportData':
            handleExportData(sendResponse);
            return true; // Will respond asynchronously
            
        case 'importData':
            handleImportData(request.data, sendResponse);
            return true;
            
        case 'getStorageInfo':
            handleGetStorageInfo(sendResponse);
            return true;
    }
});

// Handle data export
async function handleExportData(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['notes', 'settings']);
        const exportData = {
            notes: result.notes || [],
            settings: result.settings || {},
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        sendResponse({ success: true, data: exportData });
    } catch (error) {
        console.error('Export error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle data import
async function handleImportData(data, sendResponse) {
    try {
        await chrome.storage.local.set({
            notes: data.notes || [],
            settings: data.settings || {}
        });
        
        sendResponse({ success: true });
    } catch (error) {
        console.error('Import error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Get storage information
async function handleGetStorageInfo(sendResponse) {
    try {
        const bytesInUse = await chrome.storage.local.getBytesInUse();
        const result = await chrome.storage.local.get(['notes']);
        
        sendResponse({
            success: true,
            info: {
                bytesInUse,
                notesCount: (result.notes || []).length,
                quota: chrome.storage.local.QUOTA_BYTES
            }
        });
    } catch (error) {
        console.error('Storage info error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle tab updates to refresh extension state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url === 'chrome://newtab/') {
        // New tab page loaded
        console.log('BearMark new tab page loaded');
    }
});

// Error handler
chrome.runtime.onSuspend.addListener(() => {
    console.log('BearMark extension suspended');
});

console.log('BearMark background service worker loaded');
